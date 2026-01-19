import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'destructive',
    onConfirm,
    isLoading = false,
    icon: Icon = AlertCircle,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                variant === 'destructive' 
                                    ? 'bg-red-100 dark:bg-red-900/30' 
                                    : 'bg-yellow-100 dark:bg-yellow-900/30'
                            }`}>
                                <Icon className={`h-5 w-5 ${
                                    variant === 'destructive'
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-yellow-600 dark:text-yellow-400'
                                }`} />
                            </div>
                        )}
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                </DialogHeader>
                {description && (
                    <DialogDescription className="text-base">
                        {description}
                    </DialogDescription>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={() => {
                            onConfirm?.()
                            onOpenChange(false)
                        }}
                        disabled={isLoading}
                    >
                        {isLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        )}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
