import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInMinutes, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Users, TrendingUp, DollarSign, Clock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageTransition, staggerContainer, fadeInUp, scaleIn } from '@/components/PageTransition';

const statusColors: Record<string, string> = {
  agendada: 'bg-warning/15 text-warning',
  confirmada: 'bg-success/15 text-success',
  realizada: 'bg-primary/15 text-primary',
  cancelada: 'bg-muted text-muted-foreground',
  faltou: 'bg-destructive/15 text-destructive',
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
  const monthParticular = monthAppointments.filter((a: any) => a.type === 'particular' && a.status !== 'cancelada').length;
  const revenueValue = (monthParticular * (doctor?.avg_consultation_price || 350)).toLocaleString('pt-BR');

  const getPatientName = (apt: any) => apt.patients?.name || 'Paciente';

  const firstName = doctor?.name?.split(' ')[0] || '';

  return (
    <PageTransition>
    <motion.div className="space-y-6 max-w-4xl" variants={staggerContainer} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="medflow-card medflow-gradient-bg border-0 !p-6">
        <p className="text-sm font-medium text-muted-foreground">
          {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-1">
          Olá, Dra. {firstName}! 👋
        </h1>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
          value={todayAppointments.length}
          label="Consultas Hoje"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-secondary" />}
          iconBg="bg-secondary/10"
          value={patientCount}
          label="Pacientes"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-success" />}
          iconBg="bg-success/10"
          value={monthCompleted}
          label="Realizadas (Mês)"
        />
        <div className="medflow-card flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <div className="medflow-stat-icon bg-info/10">
              <DollarSign className="h-5 w-5 text-info" />
            </div>
            <button
              onClick={() => setShowRevenue(v => !v)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {showRevenue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div>
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {showRevenue ? `R$ ${revenueValue}` : 'R$ •••••'}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">Faturamento Est.</p>
          </div>
        </div>
      </motion.div>

      {/* Next Appointment */}
      {nextAppointment && (
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.35 }}
          className="medflow-card border-l-4 border-l-primary cursor-pointer !p-4"
          onClick={() => navigate('/agenda')}
        >
          <div className="flex items-center gap-3">
            <div className="medflow-stat-icon bg-primary/10 shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Próxima Consulta</p>
              <p className="text-base font-bold text-foreground truncate">
                {getPatientName(nextAppointment)} — {nextAppointment.time?.slice(0, 5)}
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 font-semibold shrink-0">
              {minutesUntilNext !== null && minutesUntilNext > 0
                ? `em ${minutesUntilNext} min`
                : 'agora'}
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Today's Appointments */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.35 }} className="medflow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Consultas de Hoje</h2>
          <button
            onClick={() => navigate('/agenda')}
            className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
          >
            Ver agenda <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {todayAppointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Nenhuma consulta agendada para hoje.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {todayAppointments.map((apt: any) => (
              <div
                key={apt.id}
                onClick={() => navigate(`/agenda`)}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/30 hover:bg-accent/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-primary tabular-nums w-12 shrink-0">
                    {apt.time?.slice(0, 5)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{getPatientName(apt)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{apt.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`${statusColors[apt.status]} border-0 text-[11px] font-medium`}>
                    {statusLabels[apt.status]}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Week Calendar */}
      <motion.div variants={fadeInUp} transition={{ duration: 0.35 }} className="medflow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Semana</h2>
          <span className="text-xs text-muted-foreground">
            {format(weekDates[0], "d MMM", { locale: ptBR })} – {format(weekDates[6], "d MMM", { locale: ptBR })}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isToday = isSameDay(date, now);
            const dayAppts = weekAppointments.filter((a: any) => a.date === dateStr);
            const count = dayAppts.length;

            return (
              <div
                key={i}
                onClick={() => navigate('/agenda')}
                className={`rounded-xl p-2.5 text-center cursor-pointer transition-all hover:shadow-md ${
                  isToday
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-accent/30 hover:bg-accent/60'
                }`}
              >
                <p className={`text-[10px] font-semibold tracking-wider ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {format(date, 'EEE', { locale: ptBR }).slice(0, 3).toUpperCase()}
                </p>
                <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {format(date, 'd')}
                </p>
                {count > 0 && (
                  <div className={`text-[10px] font-bold mt-1 ${isToday ? 'text-primary-foreground/80' : 'text-primary'}`}>
                    {count} {count === 1 ? 'cons.' : 'cons.'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
    </PageTransition>
  );
}

function StatCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
}) {
  return (
    <div className="medflow-card flex flex-col gap-2">
      <div className={`medflow-stat-icon ${iconBg}`}>
        {icon}
      </div>
      <div>
        <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
