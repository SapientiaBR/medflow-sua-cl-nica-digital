import { useLocation, Link } from 'react-router-dom';
import { Home, Users, CalendarDays, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Pacientes', icon: Users, path: '/pacientes' },
  { label: 'Agenda', icon: CalendarDays, path: '/agenda' },
  { label: 'Documentos', icon: FileText, path: '/documentos' },
  { label: 'Perfil', icon: Settings, path: '/configuracoes' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
