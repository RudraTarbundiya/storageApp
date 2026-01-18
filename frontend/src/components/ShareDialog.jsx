import { useState, useEffect } from 'react'
import { Link2, Copy, Check, Globe, Lock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publicAPI } from '@/lib/api'
import { useAlert } from '@/context'

export default function ShareDialog({
    open,
    onOpenChange,
    item,
    type = 'file' // 'file' or 'folder'
}) {
    const { showAlert } = useAlert()
    const [isPublic, setIsPublic] = useState(false)
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)

    // Reset state when item changes
    useEffect(() => {
        if (item) {
            setIsPublic(item.isPublic || false)
            setCopied(false)
        }
    }, [item])

    const shareLink = item
        ? `${window.location.origin}/share/${type}/${item._id}`
        : ''

    const handleTogglePublic = async () => {
        if (!item) return

        setLoading(true)
        try {
            const newStatus = !isPublic

            if (type === 'folder') {
                await publicAPI.toggleDirectoryPublic(item._id, newStatus)
            } else {
                await publicAPI.toggleFilePublic(item._id, newStatus)
            }

            setIsPublic(newStatus)
            showAlert(
                newStatus
                    ? `${type === 'folder' ? 'Folder' : 'File'} is now public and shareable!`
                    : `${type === 'folder' ? 'Folder' : 'File'} is now private.`
            )
        } catch (error) {
            showAlert('Failed to update sharing settings', 'destructive')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyLink = async () => {
        if (!shareLink) return

        try {
            await navigator.clipboard.writeText(shareLink)
            setCopied(true)
            showAlert('Link copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            showAlert('Failed to copy link', 'destructive')
        }
    }

    const handleOpenInNewTab = () => {
        window.open(shareLink, '_blank')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-blue-500" />
                        Share {type === 'folder' ? 'Folder' : 'File'}
                    </DialogTitle>
                    <DialogDescription>
                        {item?.name && (
                            <span className="font-medium text-foreground">"{item.name}"</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Public toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3">
                            {isPublic ? (
                                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                            )}
                            <div>
                                <p className="font-medium">
                                    {isPublic ? 'Public Access' : 'Private'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isPublic
                                        ? 'Anyone with the link can view and download'
                                        : 'Only you can access this'
                                    }
                                </p>
                            </div>
                        </div>
                        <Button
                            variant={isPublic ? "outline" : "default"}
                            size="sm"
                            onClick={handleTogglePublic}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : isPublic ? 'Make Private' : 'Make Public'}
                        </Button>
                    </div>

                    {/* Share link */}
                    {isPublic && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <Label htmlFor="share-link" className="text-sm font-medium">
                                Share Link
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="share-link"
                                    value={shareLink}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopyLink}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleOpenInNewTab}
                                    className="shrink-0"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {type === 'folder'
                                    ? 'Guest users can view and download all files in this folder'
                                    : 'Guest users can view and download this file'
                                }
                            </p>
                        </div>
                    )}

                    {/* Info for folders */}
                    {type === 'folder' && isPublic && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                <strong>Note:</strong> Making a folder public will also make all its contents (files and subfolders) public.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
