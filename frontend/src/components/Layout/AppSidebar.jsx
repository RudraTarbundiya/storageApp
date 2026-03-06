import { Home, Cloud, PanelRightClose, Globe, Users, UserCircle, HardDrive, Share2, Users2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth, useFileManager } from '@/context'

// Format bytes to human readable
const formatStorage = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getMenuItems = (userRole) => {
  const items = [
    {
      title: 'My Files',
      icon: Home,
      path: '/dashboard',
    },
    {
      title: 'Shared with me',
      icon: Users2,
      path: '/shared-with-me',
    },
    {
      title: 'Shared by me',
      icon: Share2,
      path: '/shared-by-me',
    },
    {
      title: 'My Public Shares',
      icon: Globe,
      path: '/my-public-shares',
    },
    {
      title: 'Google Drive',
      icon: Cloud,
      path: '/google-drive',
    },
    {
      title: 'Profile',
      icon: UserCircle,
      path: '/profile',
    },
  ]

  // Add Users menu item for manager, admin and owner
  if (userRole === 'manager' || userRole === 'admin' || userRole === 'owner') {
    items.push({
      title: 'Users',
      icon: Users,
      path: '/users',
    })
  }

  return items
}

export default function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { setOpenMobile, toggleSidebar, isMobile } = useSidebar()

  // Get storage info from FileManager context
  const { totalStorageUsed } = useFileManager()

  // Get user's storage limit from their profile (default 3GB if not set)
  const storageLimit = user?.maxStorage || 3 * 1024 * 1024 * 1024
  const storagePercentage = Math.min((totalStorageUsed / storageLimit) * 100, 100)

  const handleNavigation = (path) => {
    navigate(path)
    // Close mobile sidebar after navigation
    setOpenMobile(false)
  }

  const handleClose = () => {
    if (isMobile) {
      setOpenMobile(false)
    } else {
      toggleSidebar()
    }
  }

  return (
    <Sidebar collapsible="offcanvas">
      {/* Header with Logo and Close Button */}
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Cloud Storage" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-lg">Cloud Storage</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 cursor-pointer hover:bg-accent rounded-lg"
          >
            <PanelRightClose className="h-5 w-5" />
            <span className="sr-only">Close Sidebar</span>
          </Button>
        </div>
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems(user?.role).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    isActive={location.pathname === item.path}
                    className={`
                      w-full justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-200 cursor-pointer
                      ${location.pathname === item.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Storage Usage Widget */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Storage</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${storagePercentage}%`,
              backgroundColor: `hsl(${Math.max(0, 120 - (storagePercentage * 1.2))}, 70%, 50%)`
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {formatStorage(totalStorageUsed)} of {formatStorage(storageLimit)} used
        </p>
      </div>

      {/* User Profile Footer */}
      <SidebarFooter className="px-4 py-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {user?.picture && (
              <AvatarImage src={user.picture} alt={user?.name} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}