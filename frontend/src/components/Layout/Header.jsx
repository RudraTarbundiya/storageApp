import { Moon, Sun, LogOut, LogOutIcon, Menu, ChevronRight, House } from 'lucide-react'
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
import { useLocation, useNavigate } from 'react-router-dom'
import { userAPI } from '@/lib/api'
import { useSidebar } from '@/components/ui/sidebar'

export default function Header({ user }) {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [logoutMode, setLogoutMode] = useState('current') // 'current' or 'all'
  const [loading, setLoading] = useState(false)
  const { toggleSidebar, open, isMobile, setOpenMobile } = useSidebar()

  const routeLabelMap = {
    dashboard: 'Storage',
    files: 'Files',
    'shared-with-me': 'Shared with Me',
    'shared-by-me': 'Shared by Me',
    'my-public-shares': 'Public Shares',
    'google-drive': 'Google Drive',
    users: 'Users',
    profile: 'Settings',
    settings: 'Settings',
    admin: 'Admin',
  }

  const pathItems = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => routeLabelMap[segment] || segment.replace(/-/g, ' '))

  const handleLogout = async (logoutAll = false) => {
    setLoading(true)
    try {
      if (logoutAll) {
        await userAPI.logoutAll()
      } else {
        await userAPI.logout()
      }
      window.location.reload()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoading(false)
      setShowLogoutDialog(false)
    }
  }

  const handleOpenSidebar = () => {
    if (isMobile) {
      setOpenMobile(true)
    } else {
      toggleSidebar()
    }
  }

  // Show hamburger button when sidebar is closed (desktop) or always on mobile
  const showMenuButton = isMobile || !open

  return (
    <header className="sticky top-0 z-50 w-full px-2 py-2 sm:px-4 sm:py-3">
      <div className="glass-navy mx-auto flex h-17 w-full items-center justify-between gap-2 rounded-2xl px-3 sm:h-18 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Hamburger menu button - shows when sidebar is closed */}
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenSidebar}
              className="h-9 w-9 cursor-pointer rounded-xl hover:bg-accent sm:h-10 sm:w-10"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open Sidebar</span>
            </Button>
          )}

          <div className="flex items-center gap-2 font-display font-semibold">
            <img src="/logo.png" alt="Storix" className="h-8 w-8 rounded-none" />
            <span className="hidden text-lg sm:inline-block">Storix</span>
          </div>

          <div className="hidden min-w-0 items-center gap-1.5 rounded-2xl border border-border/70 bg-muted/55 px-4 py-2 md:flex">
            <House className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
            {pathItems.length === 0 ? (
              <span className="text-base text-muted-foreground">home</span>
            ) : (
              pathItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/80" />}
                  <span className={`truncate text-base ${index === pathItems.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {item}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="h-9 w-9 cursor-pointer rounded-xl transition-transform hover:scale-105 hover:bg-accent sm:h-10 sm:w-10"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 cursor-pointer rounded-xl transition-transform hover:scale-105 hover:bg-accent sm:h-10 sm:w-10">
                <Avatar className="h-10 w-10">
                  {user?.picture && <AvatarImage src={user.picture} alt={user?.name} referrerPolicy="no-referrer" />}
                  <AvatarFallback className="bg-linear-to-br from-[#134074] to-[#397bd6] text-white">
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