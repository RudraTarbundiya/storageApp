import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AlertContext = createContext({
    alert: null,
    showAlert: () => { },
    clearAlert: () => { },
})

export function AlertProvider({ children }) {
    const [alerts, setAlerts] = useState([])
    const timeoutRefs = useRef(new Map())

    const removeAlert = useCallback((id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id))

        const timeoutId = timeoutRefs.current.get(id)
        if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutRefs.current.delete(id)
        }
    }, [])

    const showAlert = useCallback((message, variant = 'default', duration = 3000) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const nextAlert = { id, message, variant }

        setAlerts(prev => [nextAlert, ...prev].slice(0, 4))

        const timeoutId = setTimeout(() => {
            removeAlert(id)
        }, duration)

        timeoutRefs.current.set(id, timeoutId)
    }, [removeAlert])

    const clearAlert = useCallback(() => {
        timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
        timeoutRefs.current.clear()
        setAlerts([])
    }, [])

    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
            timeoutRefs.current.clear()
        }
    }, [])

    const getToastStyles = (variant) => {
        switch (variant) {
            case 'destructive':
                return {
                    wrapper: 'border-red-200 bg-red-50 text-red-950 shadow-red-950/10 dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-50',
                    accent: 'bg-red-500',
                    icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300" />,
                }
            case 'warning':
                return {
                    wrapper: 'border-orange-200 bg-orange-50 text-orange-950 shadow-orange-950/10 dark:border-orange-900/60 dark:bg-orange-950/90 dark:text-orange-50',
                    accent: 'bg-orange-500',
                    icon: <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-300" />,
                }
            case 'info':
                return {
                    wrapper: 'border-cyan-200 bg-cyan-50 text-cyan-950 shadow-cyan-950/10 dark:border-cyan-900/60 dark:bg-cyan-950/90 dark:text-cyan-50',
                    accent: 'bg-cyan-500',
                    icon: <Info className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />,
                }
            case 'success':
                return {
                    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-950/10 dark:border-emerald-900/60 dark:bg-emerald-950/90 dark:text-emerald-50',
                    accent: 'bg-emerald-500',
                    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />,
                }
            default:
                return {
                    wrapper: 'border-slate-200 bg-white text-slate-950 shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50',
                    accent: 'bg-slate-500',
                    icon: <Info className="h-5 w-5 text-slate-600 dark:text-slate-300" />,
                }
        }
    }

    const value = {
        alert: alerts[0] || null,
        showAlert,
        clearAlert,
    }

    return (
        <AlertContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-100 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6 sm:w-full">
                <AnimatePresence initial={false}>
                    {alerts.map((alert) => {
                        const styles = getToastStyles(alert.variant)

                        return (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                                transition={{ duration: 0.18 }}
                                className={`pointer-events-auto overflow-hidden rounded-2xl border backdrop-blur-md ${styles.wrapper}`}
                            >
                                <div className={`h-1.5 w-full ${styles.accent}`} />
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-white/10">
                                        {styles.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-5">{alert.message}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="-mr-1 -mt-1 h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                                        onClick={() => removeAlert(alert.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </AlertContext.Provider>
    )
}

export const useAlert = () => {
    const context = useContext(AlertContext)
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider')
    }
    return context
}

export default AlertContext
