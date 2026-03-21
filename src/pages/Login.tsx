import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Stethoscope, Mail, Lock, ArrowRight, Activity, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { ok, error } = await login(email, password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      toast({ title: 'Erro ao entrar', description: error || 'Credenciais inválidas', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-emerald-600 to-teal-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MedFlow</span>
          </div>
        </div>
        
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Gestão inteligente para consultórios modernos
            </h1>
            <p className="text-white/80 text-lg">
              Organize sua clínica com praticidade e segurança
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-effect rounded-2xl p-4 text-center">
              <div className="h-10 w-10 rounded-xl bg-primary/10 mx-auto mb-2 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Agenda Inteligente</p>
            </div>
            <div className="glass-effect rounded-2xl p-4 text-center">
              <div className="h-10 w-10 rounded-xl bg-secondary/10 mx-auto mb-2 flex items-center justify-center">
                <Heart className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-sm font-medium text-foreground">Prontuários</p>
            </div>
            <div className="glass-effect rounded-2xl p-4 text-center">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 mx-auto mb-2 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-foreground">Dados Seguro</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2024 MedFlow. Todos os direitos reservados.
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">MedFlow</span>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo de volta!</h2>
            <p className="text-muted-foreground">Entre com suas credenciais para continuar</p>
          </div>
          
          <div className="medflow-card border-0 shadow-xl shadow-primary/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="pl-12 h-12 bg-accent/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-12 h-12 bg-accent/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 medflow-btn-primary rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Entrar
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem conta?{' '}
                <Link to="/cadastro" className="text-primary font-semibold hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-8">
            Ao entrar, você concorda com nossos termos de uso
          </p>
        </div>
      </div>
    </div>
  );
}
