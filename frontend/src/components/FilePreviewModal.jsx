import React from 'react'
import { X, Download, FileText, Music, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePreview } from '@/context'
import { getFileType, getFileIcon, formatFileSize } from '@/lib/fileUtils'

export default function FilePreviewModal({ onDownload }) {
    const {
        previewOpen,
        previewFile,
        previewUrl,
        closePreview
    } = usePreview();

    if (!previewOpen || !previewFile) return null

    const fileType = getFileType(previewFile.extension)

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closePreview} />

            {/* Modal Content */}
            <div className="relative z-10 w-[95vw] max-w-4xl max-h-[90vh] bg-background rounded-xl overflow-hidden shadow-2xl border flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-background shrink-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            {(() => {
                                const IconComponent = getFileIcon(previewFile.extension)
                                return <IconComponent className="h-5 w-5 text-white" />
                            })()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate text-sm md:text-base">{previewFile.name || 'Preview'}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{previewFile.extension || 'File'}</span>
                                <span>•</span>
                                <span>{formatFileSize(previewFile.size)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => onDownload?.(previewFile)} className="hidden sm:flex">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button variant="ghost" size="icon" onClick={closePreview}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview content */}
                <div className="flex flex-col items-center justify-center bg-slate-950 min-h-[300px] md:min-h-[400px] flex-1 overflow-auto">
                    {fileType === 'image' && previewUrl && (
                        <img src={previewUrl} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain" />
                    )}

                    {fileType === 'video' && previewUrl && (
                        <video
                            src={previewUrl}
                            controls
                            autoPlay
                            preload="metadata"
                            className="max-w-full max-h-[70vh]"
                        />
                    )}

                    {fileType === 'audio' && previewUrl && (
                        <div className="p-8 md:p-12 text-center w-full">
                            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <Music className="h-10 w-10 md:h-12 md:w-12 text-white" />
                            </div>
                            <h4 className="text-white font-medium mb-4 truncate px-4">{previewFile.name}</h4>
                            <audio
                                src={previewUrl}
                                controls
                                autoPlay
                                preload="metadata"
                                className="w-full max-w-md mx-auto"
                            />
                        </div>
                    )}

                    {(fileType === 'pdf' || fileType === 'document') && previewUrl && (
                        <iframe
                            src={previewUrl}
                            className="w-full h-[70vh]"
                            title={previewFile.name}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
