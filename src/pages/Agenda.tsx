import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, User, CreditCard, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const INSURANCE_OPTIONS = ['Sulamérica', 'Unimed', 'Care Plus', 'Amil', 'Alice', 'Bradesco'];

type ViewMode = 'day' | 'week' | 'month';

const statusColors: Record<string, string> = {
  agendada: 'bg-amber-50 border-amber-200 text-amber-700',
  confirmada: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  realizada: 'bg-blue-50 border-blue-200 text-blue-700',
  cancelada: 'bg-gray-50 border-gray-200 text-gray-500',
  faltou: 'bg-red-50 border-red-200 text-red-700',
};

const statusLabels: Record<string, string> = {
  agendada: 'Agendada', confirmada: 'Confirmada', realizada: 'Realizada', cancelada: 'Cancelada', faltou: 'Faltou',
};

const hours = Array.from({ length: 12 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
const TIME_SLOTS = Array.from({ length: 27 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function Agenda() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const [editingApt, setEditingApt] = useState<{ date: string; time: string; duration_minutes: string; type: string; status: string; notes: string; insurance_code: string } | null>(null);

  const [newApt, setNewApt] = useState({ patient_id: '', date: '', time: '', duration_minutes: '30', type: 'particular' as string, insurance_code: '', notes: '' });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      const d = format(currentDate, 'yyyy-MM-dd');
      return { from: d, to: d };
    } else if (viewMode === 'week') {
      return { from: format(weekDays[0], 'yyyy-MM-dd'), to: format(weekDays[6], 'yyyy-MM-dd') };
    } else {
      const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const wStart = startOfWeek(first, { weekStartsOn: 1 });
      const last = addDays(wStart, 41);
      return { from: format(wStart, 'yyyy-MM-dd'), to: format(last, 'yyyy-MM-dd') };
    }
  }, [viewMode, currentDate]);

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, patients(name, insurance)')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('time');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, name, insurance').order('name');
      return data || [];
    },
    enabled: !!user,
  });

  const createAppointment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('appointments').insert({
        doctor_id: user!.id,
        patient_id: newApt.patient_id,
        date: newApt.date,
        time: newApt.time,
        duration_minutes: parseInt(newApt.duration_minutes),
        type: newApt.type as any,
        insurance_code: newApt.insurance_code || null,
        notes: newApt.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowNewModal(false);
      setNewApt({ patient_id: '', date: '', time: '', duration_minutes: '30', type: 'particular', insurance_code: '', notes: '' });
      toast({ title: 'Consulta agendada!', description: 'A consulta foi adicionada à agenda.' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const navigateDate = (dir: number) => {
    if (viewMode === 'day') setCurrentDate(d => addDays(d, dir));
    else if (viewMode === 'week') setCurrentDate(d => addDays(d, dir * 7));
    else setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const updateAppointment = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from('appointments').update(updates).eq('id', selectedApt!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Consulta atualizada!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'cancelada' && !window.confirm('Tem certeza que deseja cancelar esta consulta?')) return;
    updateAppointment.mutate({ status: newStatus });
  };

  const handleSaveEdit = () => {
    if (!editingApt) return;
    updateAppointment.mutate({
      date: editingApt.date,
      time: editingApt.time,
      duration_minutes: parseInt(editingApt.duration_minutes),
      type: editingApt.type,
      status: editingApt.status,
      notes: editingApt.notes || null,
      insurance_code: editingApt.insurance_code || null,
    }, { onSuccess: () => setEditingApt(null) });
  };

  const handleStartEdit = () => {
    if (!selectedAppointment) return;
    setEditingApt({
      date: selectedAppointment.date,
      time: selectedAppointment.time,
      duration_minutes: String(selectedAppointment.duration_minutes),
      type: selectedAppointment.type,
      status: selectedAppointment.status,
      notes: selectedAppointment.notes || '',
      insurance_code: selectedAppointment.insurance_code || '',
    });
  };

  const getAppointmentsForDate = (date: Date) =>
    appointments.filter((a: any) => isSameDay(parseISO(a.date), date) && a.status !== 'cancelada');

  const getPatientName = (apt: any) => apt.patients?.name || '';
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const getInsuranceLabel = (apt: any) => {
    if (apt.type === 'particular') return 'Particular';
    return apt.patients?.insurance && apt.patients.insurance !== 'Particular' ? apt.patients.insurance : 'Convênio';
  };

  const selectedAppointment = selectedApt ? appointments.find((a: any) => a.id === selectedApt) : null;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Agenda
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {appointments.filter((a: any) => a.status !== 'cancelada').length} consultas agendadas
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="medflow-btn-primary gap-2">
          <Plus className="h-4 w-4" /> Nova Consulta
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)} className="rounded-xl h-10 w-10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[200px] text-center">
            {viewMode === 'day' && format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
            {viewMode === 'week' && `${format(weekStart, "d MMM", { locale: ptBR })} — ${format(addDays(weekStart, 6), "d MMM, yyyy", { locale: ptBR })}`}
            {viewMode === 'month' && format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateDate(1)} className="rounded-xl h-10 w-10">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="ml-2 text-primary">
            Hoje
          </Button>
        </div>
        <div className="flex bg-accent/50 rounded-xl p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="overflow-x-auto pb-4 animate-fade-in">
          <div className="grid grid-cols-7 gap-3 min-w-[800px]">
            {weekDays.map((day, dayIndex) => {
              const apts = getAppointmentsForDate(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className="space-y-2">
                  <div className={`text-center p-3 rounded-2xl transition-all ${isToday ? 'bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg shadow-primary/20' : 'bg-accent/30'}`}>
                    <p className={`text-xs font-medium ${isToday ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE', { locale: ptBR }).slice(0, 3).toUpperCase()}
                    </p>
                    <p className={`text-xl font-bold ${isToday ? 'text-white' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {apts.sort((a: any, b: any) => a.time.localeCompare(b.time)).map((apt: any) => (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedApt(apt.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${statusColors[apt.status]} animate-scale-in`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 opacity-60" />
                          <span className="text-xs font-semibold">{apt.time?.slice(0, 5)}</span>
                        </div>
                        <p className="text-sm font-semibold truncate">{getPatientName(apt)}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          apt.type === 'particular'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {apt.type === 'particular' ? 'Particular' : getInsuranceLabel(apt)}
                        </span>
                      </div>
                    ))}
                    {apts.length === 0 && (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-muted-foreground/50">—</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="space-y-1 animate-fade-in">
          {hours.map(hour => {
            const apts = appointments.filter(
              (a: any) => a.date === format(currentDate, 'yyyy-MM-dd') && a.time.startsWith(hour.split(':')[0]) && a.status !== 'cancelada'
            );
            return (
              <div key={hour} className="flex gap-4 py-3 border-b border-border/30">
                <span className="text-sm text-muted-foreground w-14 pt-1 font-medium">{hour}</span>
                <div className="flex-1 space-y-2">
                  {apts.map((apt: any) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedApt(apt.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] ${statusColors[apt.status]} animate-scale-in`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 rounded-xl bg-white/50">
                          <AvatarFallback className="bg-transparent text-foreground font-bold">
                            {getInitials(getPatientName(apt))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{getPatientName(apt)}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {apt.time?.slice(0, 5)} — {apt.duration_minutes}min
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {apt.type === 'particular' ? 'Particular' : getInsuranceLabel(apt)}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-medium">{statusLabels[apt.status]}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-1 animate-fade-in">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-3">{d}</div>
          ))}
          {(() => {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const startDay = startOfWeek(firstDay, { weekStartsOn: 1 });
            const cells = Array.from({ length: 42 }, (_, i) => addDays(startDay, i));
            return cells.map(day => {
              const apts = getAppointmentsForDate(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                  className={`min-h-[80px] p-2 rounded-xl cursor-pointer transition-all hover:bg-accent/50 ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${isToday ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}
                >
                  <p className={`text-sm font-medium mb-1 ${isToday ? 'text-primary font-bold' : ''}`}>{format(day, 'd')}</p>
                  {apts.length > 0 && (
                    <div className="space-y-0.5">
                      {apts.slice(0, 2).map((a: any) => (
                        <div key={a.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                          a.type === 'particular' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {a.time?.slice(0, 5)} {getPatientName(a).split(' ')[0]}
                        </div>
                      ))}
                      {apts.length > 2 && <span className="text-[10px] text-muted-foreground">+{apts.length - 2} mais</span>}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      <Dialog open={!!selectedAppointment} onOpenChange={() => { setSelectedApt(null); setEditingApt(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingApt ? (
                <>
                  <Edit2 className="h-5 w-5 text-primary" />
                  Editar Consulta
                </>
              ) : (
                <>
                  <Calendar className="h-5 w-5 text-primary" />
                  Detalhes da Consulta
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && !editingApt && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent/30">
                <Avatar className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <AvatarFallback className="bg-transparent text-foreground font-bold text-lg">
                    {getInitials(getPatientName(selectedAppointment))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground text-lg">{getPatientName(selectedAppointment)}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.patients?.insurance || 'Particular'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm font-medium">{format(parseISO(selectedAppointment.date), "d 'de' MMMM, yyyy", { locale: ptBR })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Horário</p>
                  <p className="text-sm font-medium">{selectedAppointment.time?.slice(0, 5)} ({selectedAppointment.duration_minutes}min)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium capitalize">{selectedAppointment.type === 'particular' ? 'Particular' : 'Convênio'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={`${statusColors[selectedAppointment.status]} border font-medium`}>
                    {statusLabels[selectedAppointment.status]}
                  </Badge>
                </div>
              </div>
              {selectedAppointment.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedAppointment.notes}</p>
                </div>
              )}
              <div className="flex gap-2 flex-wrap pt-2">
                {!['cancelada', 'realizada'].includes(selectedAppointment.status) && (
                  <Button size="sm" className="medflow-btn-primary" onClick={() => { setSelectedApt(null); navigate(`/atendimento/${selectedAppointment.id}`); }}>
                    <Check className="h-4 w-4 mr-1" /> Iniciar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleStartEdit}>
                  <Edit2 className="h-4 w-4 mr-1" /> Editar
                </Button>
                {selectedAppointment.status === 'agendada' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('confirmada')}>
                    <Check className="h-4 w-4 mr-1" /> Confirmar
                  </Button>
                )}
                {!['cancelada', 'realizada', 'faltou'].includes(selectedAppointment.status) && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('faltou')}>
                    <AlertCircle className="h-4 w-4 mr-1" /> Falta
                  </Button>
                )}
                {!['cancelada', 'realizada'].includes(selectedAppointment.status) && (
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleStatusChange('cancelada')}>
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
          {selectedAppointment && editingApt && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data</Label>
                  <Input type="date" className="h-11 bg-accent/30 border-0 rounded-xl" value={editingApt.date} onChange={e => setEditingApt(f => f ? { ...f, date: e.target.value } : f)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Horário</Label>
                  <Select value={editingApt.time?.slice(0, 5)} onValueChange={v => setEditingApt(f => f ? { ...f, time: v } : f)}>
                    <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue placeholder="Horário" /></SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Duração</Label>
                  <Select value={editingApt.duration_minutes} onValueChange={v => setEditingApt(f => f ? { ...f, duration_minutes: v } : f)}>
                    <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Select value={editingApt.type} onValueChange={v => setEditingApt(f => f ? { ...f, type: v } : f)}>
                    <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={editingApt.status} onValueChange={v => setEditingApt(f => f ? { ...f, status: v } : f)}>
                  <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingApt.type === 'convenio' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Convênio</Label>
                  <Select value={editingApt.insurance_code} onValueChange={v => setEditingApt(f => f ? { ...f, insurance_code: v } : f)}>
                    <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                    <SelectContent>
                      {INSURANCE_OPTIONS.map(ins => (
                        <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Observações</Label>
                <Textarea className="bg-accent/30 border-0 rounded-xl resize-none" rows={3} value={editingApt.notes} onChange={e => setEditingApt(f => f ? { ...f, notes: e.target.value } : f)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 medflow-btn-primary h-11 rounded-xl" onClick={handleSaveEdit} disabled={updateAppointment.isPending}>
                  {updateAppointment.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button variant="outline" onClick={() => setEditingApt(null)} className="h-11 rounded-xl">Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nova Consulta</DialogTitle>
                <p className="text-sm text-muted-foreground">Agende uma nova consulta</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Paciente *</Label>
              <Select value={newApt.patient_id} onValueChange={v => setNewApt(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data *</Label>
                <Input type="date" className="h-11 bg-accent/30 border-0 rounded-xl" value={newApt.date} onChange={e => setNewApt(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Horário *</Label>
                <Select value={newApt.time} onValueChange={v => setNewApt(f => ({ ...f, time: v }))}>
                  <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue placeholder="Horário" /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duração</Label>
                <Select value={newApt.duration_minutes} onValueChange={v => setNewApt(f => ({ ...f, duration_minutes: v }))}>
                  <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo</Label>
                <Select value={newApt.type} onValueChange={v => setNewApt(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newApt.type === 'convenio' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Convênio</Label>
                <Select value={newApt.insurance_code} onValueChange={v => setNewApt(f => ({ ...f, insurance_code: v }))}>
                  <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                  <SelectContent>
                    {INSURANCE_OPTIONS.map(ins => (
                      <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações</Label>
              <Textarea placeholder="Observações opcionais..." className="bg-accent/30 border-0 rounded-xl resize-none" rows={3} value={newApt.notes} onChange={e => setNewApt(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button
              className="w-full medflow-btn-primary h-12 rounded-xl"
              disabled={!newApt.patient_id || !newApt.date || !newApt.time || createAppointment.isPending}
              onClick={() => createAppointment.mutate()}
            >
              {createAppointment.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Agendando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendar Consulta
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
