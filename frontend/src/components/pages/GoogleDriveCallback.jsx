import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GoogleDriveCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Get authorization code from URL
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_DRIVE_AUTH', error }, window.location.origin)
        window.close()
      } else {
        navigate('/dashboard')
      }
      return
    }

    if (code) {
      // Send code to parent window
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_DRIVE_AUTH', code }, window.location.origin)
        window.close()
      } else {
        // If not in popup, redirect to dashboard
        navigate('/dashboard')
      }
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Completing authorization...</p>
      </div>
    </div>
  )
}
