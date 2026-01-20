import { Image as ImageIcon, Video, FileText, Music, FileCode, FileSpreadsheet, Presentation, File as FileIcon } from 'lucide-react'

export const getFileType = (extension) => {
    const ext = (extension || '').toLowerCase().replace('.', '')
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']
    const pdfExts = ['pdf']
    const codeExts = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'java', 'py', 'c', 'cpp', 'h', 'json', 'md', 'txt', 'sql', 'php', 'sh', 'xml', 'yaml', 'yml']
    const docExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt', 'ods', 'odp']

    if (imageExts.includes(ext)) return 'image'
    if (videoExts.includes(ext)) return 'video'
    if (audioExts.includes(ext)) return 'audio'
    if (pdfExts.includes(ext)) return 'pdf'
    if (codeExts.includes(ext)) return 'code'
    if (docExts.includes(ext)) return 'document'
    return 'other'
}

export const getFileIcon = (extension) => {
    const ext = (extension || '').toLowerCase().replace('.', '')
    const type = getFileType(extension)

    if (type === 'image') return ImageIcon
    if (type === 'video') return Video
    if (type === 'audio') return Music
    if (type === 'pdf') return FileText
    if (type === 'code') return FileCode

    const spreadsheetExts = ['xls', 'xlsx', 'csv', 'ods']
    const presentationExts = ['ppt', 'pptx', 'odp']

    if (spreadsheetExts.includes(ext)) return FileSpreadsheet
    if (presentationExts.includes(ext)) return Presentation

    return FileIcon
}

export const getGradient = (extension) => {
    const type = getFileType(extension)
    switch (type) {
        case 'image': return 'from-pink-500 to-rose-600'
        case 'video': return 'from-purple-500 to-indigo-600'
        case 'audio': return 'from-green-500 to-emerald-600'
        case 'pdf': return 'from-red-500 to-orange-600'
        case 'code': return 'from-cyan-500 to-blue-600'
        case 'document': return 'from-amber-500 to-orange-600'
        default: return 'from-slate-500 to-slate-600'
    }
}

export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
