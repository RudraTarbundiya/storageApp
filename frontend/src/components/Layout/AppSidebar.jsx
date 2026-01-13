import { Home, FolderOpen, Cloud, HardDrive } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const menuItems = [
  {
    title: 'My Files',
    icon: Home,
    path: '/dashboard',
  },
  {
    title: 'All Files',
    icon: FolderOpen,
    path: '/files',
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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="h-3 w-3" />
                <span>Storage</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mb-1">
                <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }} />
              </div>
              <p>4.5 GB of 10 GB used</p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}