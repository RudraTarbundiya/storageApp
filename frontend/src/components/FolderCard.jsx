import { motion } from 'framer-motion'
import { Folder, MoreVertical, Edit2, Trash2, Link2, FolderOpen, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Format file size helper
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '—'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function FolderCard({ folder, onOpen, onRename, onDelete, onShare, onDetails }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group cursor-pointer hover:shadow-lg transition-all border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 shadow-sm">
                <Folder className="w-6 h-6 text-white" />
              </div>
              {folder.isPublic && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center" title="Public">
                  <Link2 className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Show folder size */}
              <span className="text-xs text-muted-foreground font-medium">
                {formatFileSize(folder.size)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDetails?.(folder) }}>
                    <Info className="mr-2 h-4 w-4" />
                    Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare?.(folder) }}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(folder) }}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(folder) }} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-3">
            <h3 className="font-medium text-sm truncate">{folder.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {folder.itemCount || 0} items
            </p>
          </div>

          {/* Open folder button for consistency with file cards */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => onOpen?.(folder)}
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              Open Folder
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}