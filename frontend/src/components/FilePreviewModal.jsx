import { X, Download, Image as ImageIcon, Video, FileText, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Helper function to determine file type
const getFileType = (extension) => {
    const ext = (extension || '').toLowerCase().replace('.', '')
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']
    const pdfExts = ['pdf']

    if (imageExts.includes(ext)) return 'image'
    if (videoExts.includes(ext)) return 'video'
    if (audioExts.includes(ext)) return 'audio'
    if (pdfExts.includes(ext)) return 'pdf'
    return 'other'
}

// Get file icon based on type
const getFileIcon = (extension) => {
    const type = getFileType(extension)
    switch (type) {
        case 'image': return ImageIcon
        case 'video': return Video
        case 'audio': return Music
        case 'pdf': return FileText
        default: return FileText
    }
}

// Format file size helper
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function FilePreviewModal({ open, onClose, file, fileUrl, isLoading, onDownload }) {
    const fileType = getFileType(file?.extension)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-[95vw] max-w-4xl max-h-[90vh] bg-background rounded-xl overflow-hidden shadow-2xl border">
                <div className="flex items-center justify-between p-4 border-b bg-background">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            {(() => {
                                const IconComponent = getFileIcon(file?.extension)
                                return <IconComponent className="h-5 w-5 text-white" />
                            })()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate text-sm md:text-base">{file?.name || 'Preview'}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{file?.extension || 'File'}</span>
                                <span>•</span>
                                <span>{formatFileSize(file?.size)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => onDownload?.(file)} className="hidden sm:flex">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-center bg-slate-950 min-h-[300px] md:min-h-[400px] max-h-[70vh] overflow-auto">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                            <p className="text-white text-sm">Loading preview...</p>
                        </div>
                    )}

                    {!isLoading && fileType === 'image' && fileUrl && (
                        <img src={fileUrl} alt={file?.name} className="max-w-full max-h-[70vh] object-contain" />
                    )}

                    {!isLoading && fileType === 'video' && fileUrl && (
                        <video
                            src={fileUrl}
                            controls
                            autoPlay
                            preload="metadata"
                            crossOrigin="use-credentials"
                            className="max-w-full max-h-[70vh]"
                        />
                    )}

                    {!isLoading && fileType === 'audio' && fileUrl && (
                        <div className="p-8 md:p-12 text-center w-full">
                            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <Music className="h-10 w-10 md:h-12 md:w-12 text-white" />
                            </div>
                            <h4 className="text-white font-medium mb-4 truncate px-4">{file?.name}</h4>
                            <audio
                                src={fileUrl}
                                controls
                                autoPlay
                                preload="metadata"
                                crossOrigin="use-credentials"
                                className="w-full max-w-md mx-auto"
                            />
                        </div>
                    )}

                    {!isLoading && fileType === 'pdf' && fileUrl && (
                        <iframe src={fileUrl} className="w-full h-[70vh]" title={file?.name} />
                    )}

                    {!isLoading && fileType === 'other' && (
                        <div className="p-8 md:p-12 text-center text-white">
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center mx-auto mb-6">
                                <FileText className="h-8 w-8 md:h-10 md:w-10" />
                            </div>
                            <h4 className="font-medium mb-2 truncate px-4">{file?.name}</h4>
                            <p className="text-slate-400 text-sm mb-6">Preview not available for this file type</p>
                            <Button onClick={() => onDownload?.(file)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download to View
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
