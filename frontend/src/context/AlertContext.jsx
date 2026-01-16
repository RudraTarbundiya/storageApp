import { createContext, useContext, useState, useCallback } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const AlertContext = createContext({
    alert: null,
    showAlert: () => { },
    clearAlert: () => { },
})

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState(null)

    const showAlert = useCallback((message, variant = 'default') => {
        setAlert({ message, variant })
        setTimeout(() => setAlert(null), 3000)
    }, [])

    const clearAlert = useCallback(() => {
        setAlert(null)
    }, [])

    const value = {
        alert,
        showAlert,
        clearAlert,
    }

    return (
        <AlertContext.Provider value={value}>
            {children}
            {/* Global Alert Display */}
            {alert && (
                <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-2">
                    <Alert variant={alert.variant} className="shadow-lg">
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                </div>
            )}
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
