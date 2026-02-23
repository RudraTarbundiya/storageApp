import React from 'react'
import { X, File as FileIcon, Calendar, HardDrive, Globe, Lock, Users, FolderOpen, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFileIcon, getFileType, getGradient, formatFileSize } from '@/lib/fileUtils'

function DetailRow({ icon: Icon, label, value, children }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">{label}</p>
                {children || <p className="text-sm font-medium break-all">{value ?? '—'}</p>}
            </div>
        </div>
    )
}

export default function FileDetailsModal({ file, open, onClose }) {
    if (!open || !file) return null

    const IconComponent = getFileIcon(file.extension)
    const fileType = getFileType(file.extension)
    const gradient = getGradient(file.extension)

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-[94vw] max-w-md bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex items-center justify-center h-11 w-11 rounded-xl bg-linear-to-br ${gradient} shadow-md shrink-0`}>
                            <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-base truncate">{file.name}</h2>
                            <Badge variant="secondary" className="text-xs mt-0.5">{fileType}</Badge>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 ml-2">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Details */}
                <div className="overflow-y-auto flex-1 px-5 pb-5">
                    <div className="mt-2">
                        <DetailRow icon={FileIcon} label="File Name" value={file.name} />
                        <DetailRow icon={Hash} label="Extension" value={file.extension || 'Unknown'} />
                        <DetailRow icon={HardDrive} label="File Size" value={formatFileSize(file.size)} />
                        <DetailRow icon={FolderOpen} label="File ID" value={file._id || file.id} />
                        <DetailRow icon={Globe} label="Visibility">
                            <div className="flex items-center gap-2 mt-0.5">
                                {file.isPublic ? (
                                    <>
                                        <Globe className="h-3.5 w-3.5 text-green-500" />
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Public</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Private</span>
                                    </>
                                )}
                            </div>
                        </DetailRow>

                        {file.sharedWith && (
                            <DetailRow icon={Users} label="Shared With">
                                {file.sharedWith.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Not shared with anyone</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {file.sharedWith.map((entry, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {entry.email || entry.userId || entry}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </DetailRow>
                        )}

                        <DetailRow icon={Calendar} label="Created At" value={formatDate(file.createdAt)} />
                        <DetailRow icon={Calendar} label="Last Modified" value={formatDate(file.updatedAt)} />
                    </div>
                </div>
            </div>
        </div>
    )
}
