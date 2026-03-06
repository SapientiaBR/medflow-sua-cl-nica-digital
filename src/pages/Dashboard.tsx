import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInMinutes, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Users, TrendingUp, MessageSquare, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  agendada: 'bg-warning/20 text-warning',
  confirmada: 'bg-success/20 text-success',
  realizada: 'bg-primary/20 text-primary',
  cancelada: 'bg-muted text-muted-foreground',
  faltou: 'bg-destructive/20 text-destructive',
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

  // Week chart data
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
  const { data: weekAppointments = [] } = useQuery({
    queryKey: ['appointments', 'week', weekDates[0]],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('date')
        .gte('date', weekDates[0])
        .lte('date', weekDates[6]);
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
  const monthParticular = monthAppointments.filter((a: any) => a.type === 'particular' && a.status !== 'cancelada').length;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = weekDates[i];
    const label = format(addDays(weekStart, i), 'EEE', { locale: ptBR });
    const count = weekAppointments.filter((a: any) => a.date === d).length;
    return { day: label.charAt(0).toUpperCase() + label.slice(1), consultas: count };
  });

  const getPatientName = (apt: any) => apt.patients?.name || 'Paciente';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, Dra. {doctor?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="medflow-card flex flex-col items-center text-center">
          <CalendarDays className="h-6 w-6 text-primary mb-2" />
          <span className="text-3xl font-bold text-foreground">{todayAppointments.length}</span>
          <span className="text-xs text-muted-foreground">Consultas Hoje</span>
        </div>
        <div className="medflow-card flex flex-col items-center text-center">
          <Users className="h-6 w-6 text-secondary mb-2" />
          <span className="text-3xl font-bold text-foreground">{patientCount}</span>
          <span className="text-xs text-muted-foreground">Pacientes</span>
        </div>
        <div className="medflow-card flex flex-col items-center text-center">
          <TrendingUp className="h-6 w-6 text-success mb-2" />
          <span className="text-3xl font-bold text-foreground">{monthCompleted}</span>
          <span className="text-xs text-muted-foreground">Realizadas (Mês)</span>
        </div>
        <div className="medflow-card flex flex-col items-center text-center">
          <MessageSquare className="h-6 w-6 text-info mb-2" />
          <span className="text-3xl font-bold text-foreground">R$ {(monthParticular * (doctor?.avg_consultation_price || 350)).toLocaleString('pt-BR')}</span>
          <span className="text-xs text-muted-foreground">Faturamento Particular Est.</span>
        </div>
      </div>

      {nextAppointment && (
        <div className="medflow-card border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Próxima Consulta</p>
              <p className="text-lg font-bold text-primary">
                {getPatientName(nextAppointment)} — {nextAppointment.time?.slice(0, 5)}
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-0">
              {minutesUntilNext !== null && minutesUntilNext > 0
                ? `em ${minutesUntilNext} min`
                : 'agora'}
            </Badge>
          </div>
        </div>
      )}

      <div className="medflow-card">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Consultas de Hoje</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma consulta agendada para hoje.</p>
        ) : (
          <div className="space-y-2">
            {todayAppointments.map((apt: any) => (
              <div
                key={apt.id}
                onClick={() => navigate(`/agenda`)}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/30 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground w-12">{apt.time?.slice(0, 5)}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{getPatientName(apt)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{apt.type}</p>
                  </div>
                </div>
                <Badge className={`${statusColors[apt.status]} border-0 text-xs`}>
                  {statusLabels[apt.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="medflow-card">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Consultas da Semana</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="consultas" fill="hsl(174, 84%, 32%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
