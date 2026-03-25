import { useState, useMemo } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const INSURANCE_OPTIONS = ['Sulamérica', 'Unimed', 'Care Plus', 'Amil', 'Alice', 'Bradesco'];

type ViewMode = 'day' | 'week' | 'month';

const statusColors: Record<string, string> = {
  agendada: 'border-l-warning bg-warning/10',
  confirmada: 'border-l-success bg-success/10',
  realizada: 'border-l-primary bg-primary/10',
  cancelada: 'border-l-muted bg-muted/50',
  faltou: 'border-l-destructive bg-destructive/10',
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

  // New appointment form
  const [newApt, setNewApt] = useState({ patient_id: '', date: '', time: '', duration_minutes: '30', type: 'particular' as string, insurance_code: '', notes: '' });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Compute date range for query
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
      toast({ title: 'Consulta agendada!' });
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

  const getInsuranceLabel = (apt: any) => {
    if (apt.type === 'particular') return 'Particular';
    return apt.patients?.insurance && apt.patients.insurance !== 'Particular' ? apt.patients.insurance : 'Convênio';
  };

  const selectedAppointment = selectedApt ? appointments.find((a: any) => a.id === selectedApt) : null;

  return (
    <PageTransition>
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        <Button onClick={() => setShowNewModal(true)} className="medflow-btn gap-2">
          <Plus className="h-4 w-4" /> Nova Consulta
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[180px] text-center">
            {viewMode === 'day' && format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
            {viewMode === 'week' && `${format(weekStart, "d MMM", { locale: ptBR })} — ${format(addDays(weekStart, 6), "d MMM", { locale: ptBR })}`}
            {viewMode === 'month' && format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex bg-accent rounded-lg p-0.5">
          {(['day', 'week', 'month'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {weekDays.map(day => {
              const apts = getAppointmentsForDate(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className="space-y-1">
                  <div className={`text-center p-2 rounded-xl ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                    <p className="text-xs font-medium uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                    <p className="text-lg font-bold">{format(day, 'd')}</p>
                  </div>
                  <div className="space-y-1">
                    {apts.sort((a: any, b: any) => a.time.localeCompare(b.time)).map((apt: any) => (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedApt(apt.id)}
                        className={`p-2 rounded-lg border-l-4 cursor-pointer text-xs transition-all hover:scale-[1.02] ${statusColors[apt.status]}`}
                      >
                        <p className="font-semibold">{apt.time?.slice(0, 5)}</p>
                        <p className="truncate">{getPatientName(apt)}</p>
                        <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          apt.type === 'particular'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {apt.type === 'particular' ? 'Part.' : getInsuranceLabel(apt)}
                        </span>
                      </div>
                    ))}
                    {apts.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center p-2">—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="space-y-1">
          {hours.map(hour => {
            const apts = appointments.filter(
              (a: any) => a.date === format(currentDate, 'yyyy-MM-dd') && a.time.startsWith(hour.split(':')[0]) && a.status !== 'cancelada'
            );
            return (
              <div key={hour} className="flex gap-3 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground w-12 pt-1">{hour}</span>
                <div className="flex-1 space-y-1">
                  {apts.map((apt: any) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedApt(apt.id)}
                      className={`p-3 rounded-xl border-l-4 cursor-pointer transition-all hover:scale-[1.01] ${statusColors[apt.status]}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{getPatientName(apt)}</p>
                          <p className="text-xs text-muted-foreground">{apt.time?.slice(0, 5)} — {apt.duration_minutes}min</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            apt.type === 'particular'
                              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {getInsuranceLabel(apt)}
                          </span>
                          <Badge variant="outline" className="text-xs">{statusLabels[apt.status]}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-1">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
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
                  className={`min-h-[60px] p-1 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${isToday ? 'bg-primary/10 ring-1 ring-primary' : ''}`}
                >
                  <p className="text-xs font-medium">{format(day, 'd')}</p>
                  {apts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {apts.slice(0, 3).map((a: any) => (
                        <div key={a.id} className={`w-1.5 h-1.5 rounded-full ${
                          a.type === 'particular' ? 'bg-violet-500' : 'bg-blue-500'
                        }`} />
                      ))}
                      {apts.length > 3 && <span className="text-[10px] text-muted-foreground">+{apts.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => { setSelectedApt(null); setEditingApt(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingApt ? 'Editar Consulta' : 'Detalhes da Consulta'}</DialogTitle>
          </DialogHeader>
          {selectedAppointment && !editingApt && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">Paciente:</span> {getPatientName(selectedAppointment)}</p>
                <p className="text-sm"><span className="font-medium">Data:</span> {format(parseISO(selectedAppointment.date), "d 'de' MMMM, yyyy", { locale: ptBR })}</p>
                <p className="text-sm"><span className="font-medium">Horário:</span> {selectedAppointment.time?.slice(0, 5)} ({selectedAppointment.duration_minutes}min)</p>
                <p className="text-sm"><span className="font-medium">Tipo:</span> <span className="capitalize">{selectedAppointment.type}</span></p>
                {selectedAppointment.notes && <p className="text-sm"><span className="font-medium">Observações:</span> {selectedAppointment.notes}</p>}
                <p className="text-sm"><span className="font-medium">Status:</span> <Badge className={`${statusColors[selectedAppointment.status]} border-0 ml-1`}>{statusLabels[selectedAppointment.status]}</Badge></p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {!['cancelada', 'realizada'].includes(selectedAppointment.status) && (
                  <Button size="sm" className="medflow-btn" onClick={() => { setSelectedApt(null); navigate(`/atendimento/${selectedAppointment.id}`); }}>
                    Iniciar Atendimento
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleStartEdit}>Editar</Button>
                {selectedAppointment.status === 'agendada' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('confirmada')}>Confirmar</Button>
                )}
                {!['cancelada', 'realizada', 'faltou'].includes(selectedAppointment.status) && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('faltou')}>Marcar Falta</Button>
                )}
                {!['cancelada', 'realizada'].includes(selectedAppointment.status) && (
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleStatusChange('cancelada')}>Cancelar</Button>
                )}
              </div>
            </div>
          )}
          {selectedAppointment && editingApt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={editingApt.date} onChange={e => setEditingApt(f => f ? { ...f, date: e.target.value } : f)} />
                </div>
              <div className="space-y-2">
                  <Label>Horário</Label>
                  <Select value={editingApt.time?.slice(0, 5)} onValueChange={v => setEditingApt(f => f ? { ...f, time: v } : f)}>
                    <SelectTrigger><SelectValue placeholder="Horário" /></SelectTrigger>
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
                  <Label>Duração</Label>
                  <Select value={editingApt.duration_minutes} onValueChange={v => setEditingApt(f => f ? { ...f, duration_minutes: v } : f)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={editingApt.type} onValueChange={v => setEditingApt(f => f ? { ...f, type: v } : f)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editingApt.status} onValueChange={v => setEditingApt(f => f ? { ...f, status: v } : f)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingApt.type === 'convenio' && (
                <div className="space-y-2">
                  <Label>Convênio</Label>
                  <Select value={editingApt.insurance_code} onValueChange={v => setEditingApt(f => f ? { ...f, insurance_code: v } : f)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                    <SelectContent>
                      {INSURANCE_OPTIONS.map(ins => (
                        <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={editingApt.notes} onChange={e => setEditingApt(f => f ? { ...f, notes: e.target.value } : f)} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 medflow-btn" onClick={handleSaveEdit} disabled={updateAppointment.isPending}>
                  {updateAppointment.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => setEditingApt(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Consulta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={newApt.patient_id} onValueChange={v => setNewApt(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={newApt.date} onChange={e => setNewApt(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={newApt.time} onValueChange={v => setNewApt(f => ({ ...f, time: v }))}>
                  <SelectTrigger><SelectValue placeholder="Horário" /></SelectTrigger>
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
                <Label>Duração</Label>
                <Select value={newApt.duration_minutes} onValueChange={v => setNewApt(f => ({ ...f, duration_minutes: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newApt.type} onValueChange={v => setNewApt(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newApt.type === 'convenio' && (
              <div className="space-y-2">
                <Label>Convênio</Label>
                <Select value={newApt.insurance_code} onValueChange={v => setNewApt(f => ({ ...f, insurance_code: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                  <SelectContent>
                    {INSURANCE_OPTIONS.map(ins => (
                      <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Observações opcionais..." value={newApt.notes} onChange={e => setNewApt(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button
              className="w-full medflow-btn"
              disabled={!newApt.patient_id || !newApt.date || !newApt.time || createAppointment.isPending}
              onClick={() => createAppointment.mutate()}
            >
              {createAppointment.isPending ? 'Agendando...' : 'Agendar Consulta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
