import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInMinutes, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Users, TrendingUp, MessageSquare, Clock, Eye, EyeOff, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const statusColors: Record<string, string> = {
  agendada: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  realizada: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelada: 'bg-gray-100 text-gray-500 border-gray-200',
  faltou: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  faltou: 'Faltou',
};

export default function Dashboard() {
  const { doctor, user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const monthStr = format(now, 'yyyy-MM');
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const [showRevenue, setShowRevenue] = useState(false);

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['appointments', 'today', todayStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, patients(name, insurance)')
        .eq('date', todayStr)
        .neq('status', 'cancelada')
        .order('time');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: monthAppointments = [] } = useQuery({
    queryKey: ['appointments', 'month', monthStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('date, type, status')
        .gte('date', `${monthStr}-01`)
        .lte('date', `${monthStr}-31`);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: patientCount = 0 } = useQuery({
    queryKey: ['patients', 'count'],
    queryFn: async () => {
      const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      return count || 0;
    },
    enabled: !!user,
  });

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const { data: weekAppointments = [] } = useQuery({
    queryKey: ['appointments', 'week', format(weekDates[0], 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('date, time, status, patients(name)')
        .gte('date', format(weekDates[0], 'yyyy-MM-dd'))
        .lte('date', format(weekDates[6], 'yyyy-MM-dd'))
        .neq('status', 'cancelada')
        .order('time');
      return data || [];
    },
    enabled: !!user,
  });

  const nextAppointment = useMemo(() => {
    const nowTime = format(now, 'HH:mm');
    return todayAppointments.find((a: any) => a.time >= nowTime && (a.status === 'agendada' || a.status === 'confirmada'));
  }, [todayAppointments, now]);

  const minutesUntilNext = nextAppointment
    ? differenceInMinutes(new Date(`${todayStr}T${nextAppointment.time}`), now)
    : null;

  const monthCompleted = monthAppointments.filter((a: any) => a.status === 'realizada').length;
  const monthTotal = monthAppointments.filter((a: any) => a.status !== 'cancelada').length;
  const monthParticular = monthAppointments.filter((a: any) => a.type === 'particular' && a.status !== 'cancelada').length;
  const revenueValue = (monthParticular * (doctor?.avg_consultation_price || 350));
  const monthProgress = monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0;

  const getPatientName = (apt: any) => apt.patients?.name || 'Paciente';
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary animate-pulse-soft" />
            <span className="text-sm font-medium text-primary">Bom dia!</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Dra. {doctor?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground capitalize mt-1">
            {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        {nextAppointment && (
          <div className="medflow-card-gradient rounded-2xl p-5 text-white animate-scale-in">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center animate-float">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm opacity-80">Próxima consulta</p>
                <p className="text-xl font-bold">{getPatientName(nextAppointment)}</p>
                <p className="text-sm opacity-90">{nextAppointment.time?.slice(0, 5)} • {minutesUntilNext !== null && minutesUntilNext > 0 ? `em ${minutesUntilNext} min` : 'agora'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="medflow-card group cursor-pointer animate-slide-up stagger-1 hover:border-primary/30" onClick={() => navigate('/agenda')}>
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">{todayAppointments.length}</span>
            <p className="text-sm text-muted-foreground mt-1">Consultas Hoje</p>
          </div>
          <Progress value={monthProgress} className="h-1.5 mt-3 bg-muted" />
        </div>

        <div className="medflow-card group cursor-pointer animate-slide-up stagger-2 hover:border-secondary/30" onClick={() => navigate('/pacientes')}>
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-secondary to-blue-400 flex items-center justify-center shadow-lg shadow-secondary/20 group-hover:shadow-xl group-hover:shadow-secondary/30 transition-all">
              <Users className="h-6 w-6 text-white" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">{patientCount}</span>
            <p className="text-sm text-muted-foreground mt-1">Pacientes</p>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <Activity className="h-3 w-3 text-secondary" />
            <span className="text-xs text-secondary font-medium">Ativos</span>
          </div>
        </div>

        <div className="medflow-card animate-slide-up stagger-3">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              {monthStr === format(now, 'yyyy-MM') ? format(now, 'MMM') : ''}
            </Badge>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">{monthCompleted}</span>
            <p className="text-sm text-muted-foreground mt-1">Consultas Realizadas</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">de {monthTotal} agendadas</span>
          </div>
        </div>

        <div className="medflow-card animate-slide-up stagger-4 relative overflow-hidden">
          <button
            onClick={() => setShowRevenue(v => !v)}
            className="absolute top-3 right-3 p-2 rounded-xl hover:bg-accent/50 transition-colors"
          >
            {showRevenue ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </button>
          <div className="flex items-start">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">
              {showRevenue ? `R$ ${revenueValue.toLocaleString('pt-BR')}` : 'R$ •••••'}
            </span>
            <p className="text-sm text-muted-foreground mt-1">Faturamento Particular</p>
          </div>
          {showRevenue && (
            <div className="mt-3 text-xs text-muted-foreground animate-fade-in">
              {monthParticular} consultas x R$ {(doctor?.avg_consultation_price || 350).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 medflow-card animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Consultas de Hoje</h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {todayAppointments.length} hoje
            </Badge>
          </div>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">Nenhuma consulta agendada para hoje</p>
              <button onClick={() => navigate('/agenda')} className="mt-3 text-sm text-primary font-medium hover:underline">
                Agendar nova consulta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((apt: any, index: number) => (
                <div
                  key={apt.id}
                  onClick={() => navigate('/agenda')}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-accent/30 hover:bg-accent/50 cursor-pointer transition-all hover:shadow-md group animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Avatar className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all">
                    <AvatarFallback className="bg-transparent text-foreground font-semibold">
                      {getInitials(getPatientName(apt))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{getPatientName(apt)}</p>
                    <p className="text-sm text-muted-foreground">{apt.time?.slice(0, 5)} • {apt.duration_minutes || 30}min • {apt.type === 'particular' ? 'Particular' : apt.patients?.insurance || 'Convênio'}</p>
                  </div>
                  <Badge className={`${statusColors[apt.status]} border text-xs font-medium`}>
                    {statusLabels[apt.status]}
                  </Badge>
                </div>
              ))}
              {todayAppointments.length > 5 && (
                <button onClick={() => navigate('/agenda')} className="w-full py-3 text-sm text-primary font-medium hover:bg-accent/30 rounded-xl transition-colors">
                  Ver todas as {todayAppointments.length} consultas
                </button>
              )}
            </div>
          )}
        </div>

        <div className="medflow-card animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Semana</h2>
            <button onClick={() => navigate('/agenda')} className="text-xs text-primary font-medium hover:underline">
              Ver agenda
            </button>
          </div>
          <div className="space-y-2">
            {weekDates.map((date, i) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isToday = isSameDay(date, now);
              const dayAppts = weekAppointments.filter((a: any) => a.date === dateStr);
              const count = dayAppts.length;

              return (
                <div
                  key={i}
                  onClick={() => { navigate('/agenda'); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:shadow-md ${
                    isToday
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20'
                      : 'bg-accent/30 hover:bg-accent/50'
                  }`}
                >
                  <div className={`text-center min-w-[40px] ${isToday ? 'text-white/90' : ''}`}>
                    <p className={`text-xs font-medium ${isToday ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {format(date, 'EEE', { locale: ptBR }).slice(0, 3).toUpperCase()}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-foreground'}`}>
                      {format(date, 'd')}
                    </p>
                  </div>
                  <div className="flex-1">
                    {count > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {dayAppts.slice(0, 3).map((a: any, idx: number) => (
                          <div
                            key={idx}
                            className={`h-2 w-2 rounded-full ${
                              a.status === 'confirmada' 
                                ? (isToday ? 'bg-white/60' : 'bg-emerald-500')
                                : isToday ? 'bg-white/40' : 'bg-primary/60'
                            }`}
                          />
                        ))}
                        {count > 3 && (
                          <span className={`text-xs ${isToday ? 'text-white/70' : 'text-muted-foreground'}`}>
                            +{count - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`text-xs ${isToday ? 'text-white/50' : 'text-muted-foreground'}`}>
                        Sem consultas
                      </span>
                    )}
                  </div>
                  {count > 0 && (
                    <Badge className={`${isToday ? 'bg-white/20 text-white border-0' : 'bg-primary/10 text-primary border-0'} text-xs font-semibold min-w-[24px] justify-center`}>
                      {count}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}