import { Moon, Sun, User, LogOut, Cloud, LogOutIcon, Menu } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '@/lib/api'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function Header({ user }) {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [logoutMode, setLogoutMode] = useState('current') // 'current' or 'all'
  const [loading, setLoading] = useState(false)

  const handleLogout = async (logoutAll = false) => {
    setLoading(true)
    try {
      if (logoutAll) {
        await userAPI.logoutAll()
      } else {
        await userAPI.logout()
      }
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoading(false)
      setShowLogoutDialog(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile sidebar trigger */}
          <SidebarTrigger className="md:hidden cursor-pointer hover:bg-accent" />

          <div className="flex items-center gap-2 font-semibold">
            <img src="/logo.png" alt="Cloud Storage" className="h-8 w-8 rounded-lg" />
            <span className="hidden sm:inline-block">Cloud Storage</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="rounded-full cursor-pointer hover:bg-accent hover:scale-105 transition-transform"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full cursor-pointer hover:bg-accent hover:scale-105 transition-transform">
                <Avatar className="h-10 w-10">
                  {user?.picture && <AvatarImage src={user.picture} alt={user?.name} />}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setLogoutMode('current'); setShowLogoutDialog(true) }}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setLogoutMode('all'); setShowLogoutDialog(true) }} className="text-destructive">
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Log out all devices</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {logoutMode === 'all' ? 'Log out from all devices?' : 'Log out?'}
            </DialogTitle>
            <DialogDescription>
              {logoutMode === 'all'
                ? 'You will be logged out from all devices. You will need to sign in again.'
                : 'You will be logged out from this device.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={() => handleLogout(logoutMode === 'all')}
              disabled={loading}
              variant={logoutMode === 'all' ? 'destructive' : 'default'}
            >
              {loading ? 'Logging out...' : 'Log out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}