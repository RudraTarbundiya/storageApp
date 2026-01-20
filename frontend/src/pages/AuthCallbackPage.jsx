import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cloud } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getAuthCodeFromUrl } from '@/lib/googleAuth'
import { googleDriveAPI } from '@/lib/api'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const code = getAuthCodeFromUrl()
        
        if (!code) {
          setError('No authorization code found')
          setTimeout(() => navigate('/google-drive'), 2000)
          return
        }

        // Send code to backend to exchange for tokens
        await googleDriveAPI.authorize(code)
        
        // Redirect to Google Drive page
        navigate('/google-drive')
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(err.response?.data?.error || 'Authentication failed')
        setTimeout(() => navigate('/google-drive'), 3000)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 mx-auto shadow-xl animate-pulse">
          <Cloud className="w-10 h-10 text-white" />
        </div>
        
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Connecting to Google Drive</h1>
            <p className="text-muted-foreground">Please wait while we complete the authentication...</p>
          </>
        )}
      </div>
    </div>
  )
}