import File from '../models/fileModel.js'
import { getS3ObjectBuffer } from './s3.service.js'

const WORD_LIMIT = 3000
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY

const TEXT_EXTENSIONS = new Set([
    'txt', 'md', 'markdown', 'csv', 'json', 'xml', 'html', 'htm', 'log', 'rtf', 'yaml', 'yml',
    'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'sass', 'less', 'sql', 'py', 'java', 'c', 'cpp', 'h',
    'hpp', 'go', 'rb', 'php', 'sh', 'bat', 'ps1', 'ini', 'toml', 'env'
])

const isSupportedSummaryFile = (file) => {
    const extension = (file?.extension || '').toLowerCase().replace('.', '')
    return extension === 'pdf' || TEXT_EXTENSIONS.has(extension)
}

const getFileBufferText = async (file) => {
    const key = `${file._id}${file.extension || ''}`
    const buffer = await getS3ObjectBuffer(key)

    if ((file.extension || '').toLowerCase() === '.pdf') {
        const pdfModule = await import('pdf-parse')
        const PDFParseClass = pdfModule?.PDFParse

        if (typeof PDFParseClass !== 'function') {
            throw new Error('pdf-parse module does not expose PDFParse class')
        }

        const parser = new PDFParseClass({ data: buffer })
        try {
            const parsed = await parser.getText()
            return parsed?.text || ''
        } finally {
            await parser.destroy().catch(() => { })
        }
    }

    return buffer.toString('utf8')
}

const truncateToWords = (text, maxWords) => {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean)
    if (words.length <= maxWords) {
        return words.join(' ')
    }
    return words.slice(0, maxWords).join(' ')
}

const normalizeList = (items, maxItems) => {
    return [...new Set(
        (Array.isArray(items) ? items : [])
            .map(item => String(item || '').trim())
            .filter(Boolean)
    )].slice(0, maxItems)
}

const extractJsonPayload = (rawText) => {
    const cleaned = String(rawText || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) {
        return null
    }

    try {
        return JSON.parse(match[0])
    } catch {
        return null
    }
}

const buildSummaryPrompt = (fileName, text) => {
    return [
        `Summarize the uploaded file "${fileName}" for a storage app user.`,
        'Return valid JSON only with this shape:',
        '{"summaryPoints":["..."],"summaryTags":["..."]}',
        'Rules:',
        '- summaryPoints must contain 3 to 5 bullet points.',
        '- summaryTags must contain 3 to 4 concise relatable tags.',
        '- Use only the provided text. Do not invent facts.',
        '- Keep each bullet short and useful.',
        '- Do not wrap the response in markdown fences.',
        '',
        'File text:',
        text
    ].join('\n')
}

const callGemini = async ({ fileName, text }) => {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured')
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: buildSummaryPrompt(fileName, text) }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 512,
                    responseMimeType: 'application/json'
                }
            })
        }
    )

    if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`Gemini request failed with status ${response.status}${errorText ? `: ${errorText}` : ''}`)
    }

    const payload = await response.json()
    const rawText = payload?.candidates?.[0]?.content?.parts?.map(part => part?.text || '').join('') || ''
    const parsed = extractJsonPayload(rawText)

    if (!parsed) {
        throw new Error('Gemini response was not valid JSON')
    }

    const summaryPoints = normalizeList(parsed.summaryPoints, 5)
    const summaryTags = normalizeList(parsed.summaryTags, 4).map(tag => tag.toLowerCase())

    return {
        summaryPoints: summaryPoints.slice(0, 5),
        summaryTags: summaryTags.slice(0, 4)
    }
}

export const generateAndStoreFileSummary = async (fileInput) => {
    try {
        const file = fileInput?._id ? fileInput : await File.findById(fileInput)
        if (!file || !isSupportedSummaryFile(file)) {
            return null
        }

        const rawText = await getFileBufferText(file)
        const preparedText = truncateToWords(rawText, WORD_LIMIT)
        if (!preparedText) {
            return null
        }

        const summary = await callGemini({ fileName: file.name, text: preparedText })

        if (!summary.summaryPoints.length && !summary.summaryTags.length) {
            return null
        }

        file.summaryPoints = summary.summaryPoints
        file.summaryTags = summary.summaryTags
        file.summaryGeneratedAt = new Date()
        await file.save()

        return summary
    } catch (error) {
        console.error('Failed to generate file summary:', error)
        return null
    }
}