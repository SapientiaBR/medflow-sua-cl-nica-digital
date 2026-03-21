import { Home, Users, CalendarDays, FileText, Settings, Stethoscope, LogOut, Bell } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Pacientes', url: '/pacientes', icon: Users },
  { title: 'Agenda', url: '/agenda', icon: CalendarDays },
  { title: 'Documentos', url: '/documentos', icon: FileText },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { doctor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

  return (
    <Sidebar collapsible="icon" className="hidden md:flex border-r border-border bg-card">
      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <div className="animate-fade-in">
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">MedFlow</span>
                  <p className="text-[10px] text-muted-foreground -mt-1">Gestão Médica</p>
                </div>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-accent/50 group"
                      activeClassName="bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
                      {!collapsed && <span className="animate-fade-in">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-border/50">
        {!collapsed && (
          <div className="mb-2 rounded-xl bg-gradient-to-r from-accent/50 to-accent/30 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                <AvatarFallback className="bg-transparent text-foreground font-bold text-sm">
                  {getInitials(doctor?.name || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {doctor?.name?.split(' ').slice(0, 2).join(' ') || 'Doutor(a)'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{doctor?.crm}</p>
              </div>
              <button className="relative p-1.5 rounded-lg hover:bg-accent transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
              </button>
            </div>
          </div>
        )}
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="animate-fade-in">Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
