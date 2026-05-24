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
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group  rounded-2xl border-border/80 bg-card/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" title={`name: ${folder.name}\nSize: ${formatFileSize(folder.size)}`}>
        <CardContent className="p-3.5">
          <div className="mb-2.5 flex items-start justify-between">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 shadow-sm">
                <Folder className="h-6 w-6 text-white" />
              </div>
              {folder.isPublic && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center" title="Public">
                  <Link2 className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Show folder size */}
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatFileSize(folder.size)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg cursor-pointer"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
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

          <div className="mb-2.5">
            <h3 className="truncate text-[15px] font-semibold leading-tight">{folder.name}</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {folder.itemCount || 0} items
            </p>
          </div>

          {/* Open folder button for consistency with file cards */}
          <div className="border-t border-border/70 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7.5 w-full rounded-lg border-border/80 text-[11px] cursor-pointer"
              onClick={() => onOpen?.(folder)}
            >
              <FolderOpen className="mr-1 h-3 w-3" />
              Open Folder
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}