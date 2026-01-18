import { Home, Cloud, PanelRightClose } from 'lucide-react'
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
import { useAuth } from '@/context'

const menuItems = [
  {
    title: 'My Files',
    icon: Home,
    path: '/dashboard',
  },
  {
    title: 'Google Drive',
    icon: Cloud,
    path: '/google-drive',
  },
]

export default function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { setOpenMobile, toggleSidebar, isMobile } = useSidebar()

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
              {menuItems.map((item) => (
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

      {/* User Profile Footer */}
      <SidebarFooter className="px-4 py-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {user?.picture && (
              <AvatarImage src={user.picture} alt={user?.name} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
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