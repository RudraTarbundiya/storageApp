import { motion } from 'framer-motion'
import { MoreVertical, Download, Edit2, Trash2, ExternalLink, Link2, Eye, Info } from 'lucide-react'
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
import { getFileType, getFileIcon, formatFileSize } from '@/lib/fileUtils'


export default function FileCard({ file, onRename, onDelete, onDownload, onOpen, onShare, onPreview, onDetails }) {
  const IconComponent = getFileIcon(file.extension)
  const fileType = getFileType(file.extension)
  const isPreviewable = ['image', 'video', 'audio', 'pdf'].includes(fileType)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group cursor-pointer rounded-2xl border-border/80 bg-card/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        title={`name: ${file.name}\nSize: ${formatFileSize(file.size)}`}
      >
        <CardContent className="p-3.5">
          <div className="mb-2.5 flex items-start justify-between">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#13315c] via-[#134074] to-[#397bd6] shadow-sm">
                <IconComponent className="h-5 w-5 text-[#eef4ed]" />
              </div>
              {file.isPublic && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center" title="Public">
                  <Link2 className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg cursor-pointer"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end ">
                  <DropdownMenuItem onClick={() => onDetails?.(file)}>
                    <Info className="mr-2 h-4 w-4 " />
                    Details
                  </DropdownMenuItem>
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

          <div className="mb-2.5">
            <h3 className="mb-1 truncate text-[15px] font-semibold leading-tight">{file.name}</h3>
            <Badge variant="outline" className="border-primary/25 bg-secondary/50 text-[11px] text-primary">
              {file.extension || 'File'}
            </Badge>
          </div>

          {/* Always visible action buttons */}
          <div className="flex gap-1.5 border-t border-border/70 pt-2">
            {isPreviewable && (
              <Button
                variant="outline"
                size="sm"
                className="h-7.5 flex-1 rounded-lg border-border/80 text-[11px]"
                onClick={() => onPreview?.(file)}
              >
                <Eye className="mr-1 h-3 w-3" />
                Preview
              </Button>
            )}
            <Button
              variant={isPreviewable ? "secondary" : "outline"}
              size="sm"
              className={`${isPreviewable ? 'flex-1' : 'w-full'} h-7.5 rounded-lg text-[11px]`}
              onClick={() => onDownload?.(file)}
            >
              <Download className="mr-1 h-3 w-3" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}