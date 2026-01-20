import { motion } from 'framer-motion'
import { File, MoreVertical, Download, Edit2, Trash2, ExternalLink, Link2, Eye, Image as ImageIcon, Video, FileText, Music } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

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
    default: return File
  }
}

// Get gradient colors based on file type
const getGradient = (extension) => {
  const type = getFileType(extension)
  switch (type) {
    case 'image': return 'from-pink-500 to-rose-600'
    case 'video': return 'from-purple-500 to-indigo-600'
    case 'audio': return 'from-green-500 to-emerald-600'
    case 'pdf': return 'from-red-500 to-orange-600'
    default: return 'from-blue-500 to-purple-600'
  }
}

export default function FileCard({ file, onRename, onDelete, onDownload, onOpen, onShare, onPreview }) {
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const IconComponent = getFileIcon(file.extension)
  const fileType = getFileType(file.extension)
  const isPreviewable = ['image', 'video', 'audio', 'pdf'].includes(fileType)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all border-slate-200 dark:border-slate-800"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="relative">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-linear-to-br ${getGradient(file.extension)} shadow-sm`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              {file.isPublic && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center" title="Public">
                  <Link2 className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                {formatFileSize(file.size)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpen?.(file)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare?.(file)}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRename?.(file)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete?.(file)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-3">
            <h3 className="font-medium text-sm truncate mb-1">{file.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {file.extension || 'File'}
            </Badge>
          </div>

          {/* Always visible action buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {isPreviewable && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => onPreview?.(file)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
            )}
            <Button
              variant={isPreviewable ? "secondary" : "outline"}
              size="sm"
              className={`${isPreviewable ? 'flex-1' : 'w-full'} h-8 text-xs`}
              onClick={() => onDownload?.(file)}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}