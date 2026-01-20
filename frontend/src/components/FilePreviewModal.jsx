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
        previewText,
        previewLoading,
        closePreview
    } = usePreview();

    const [showFallBackText, setShowFallBackText] = React.useState(false)

    // Reset fallback state when modal closes or file changes
    React.useEffect(() => {
        if (!previewOpen) {
            setShowFallBackText(false);
        }
    }, [previewOpen]);

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
                    {previewLoading && (
                        <div className="flex flex-col items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                            <p className="text-white text-sm">Loading preview...</p>
                        </div>
                    )}

                    {!previewLoading && fileType === 'image' && previewUrl && (
                        <img src={previewUrl} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain" />
                    )}

                    {!previewLoading && fileType === 'video' && previewUrl && (
                        <video
                            src={previewUrl}
                            controls
                            autoPlay
                            preload="metadata"
                            className="max-w-full max-h-[70vh]"
                        />
                    )}

                    {!previewLoading && fileType === 'audio' && previewUrl && (
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

                    {!previewLoading && (fileType === 'pdf' || fileType === 'document') && previewUrl && (
                        <iframe
                            src={previewUrl}
                            className="w-full h-[70vh]"
                            title={previewFile.name}
                        />
                    )}

                    {!previewLoading && fileType === 'code' && (
                        <div className="w-full h-[70vh] bg-slate-900 overflow-auto p-4 font-mono text-sm text-slate-300">
                            <pre className="whitespace-pre-wrap">{previewText}</pre>
                        </div>
                    )}

                    {!previewLoading && (fileType === 'other' || showFallBackText) && (
                        <div className="p-8 md:p-12 text-center text-white w-full">
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center mx-auto mb-6">
                                <FileText className="h-8 w-8 md:h-10 md:w-10" />
                            </div>
                            <h4 className="font-medium mb-2 truncate px-4">{previewFile.name}</h4>
                            <p className="text-slate-400 text-sm mb-6">Preview might not be available for this file type</p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Button onClick={() => onDownload?.(previewFile)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download to View
                                </Button>
                                {!showFallBackText && (
                                    <Button variant="outline" onClick={() => setShowFallBackText(true)}>
                                        <Terminal className="h-4 w-4 mr-2" />
                                        View as Text
                                    </Button>
                                )}
                            </div>

                            {showFallBackText && (
                                <div className="mt-8 text-left bg-slate-900 p-4 rounded-lg border border-slate-800 max-h-[40vh] overflow-auto w-full max-w-2xl mx-auto">
                                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Text Preview Attempt</p>
                                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-400">{previewText || "Decoding file content..."}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
