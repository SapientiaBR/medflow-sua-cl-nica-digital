import { useLocation, Link } from 'react-router-dom';
import { Home, Users, CalendarDays, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Pacientes', icon: Users, path: '/pacientes' },
  { label: 'Agenda', icon: CalendarDays, path: '/agenda' },
  { label: 'Docs', icon: FileText, path: '/documentos' },
  { label: 'Perfil', icon: Settings, path: '/configuracoes' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-all duration-200 rounded-xl',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
              <span className={cn('font-medium', isActive && 'font-semibold')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
