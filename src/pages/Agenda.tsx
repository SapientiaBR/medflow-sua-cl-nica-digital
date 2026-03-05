import { useState, useMemo } from 'react';
import { mockAppointments, mockPatients, INSURANCE_OPTIONS } from '@/data/mock';
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

const getInsuranceLabel = (apt: typeof mockAppointments[0]) => {
  if (apt.type === 'particular') return 'Particular';
  const patient = mockPatients.find(p => p.id === apt.patient_id);
  return patient?.insurance && patient.insurance !== 'Particular' ? patient.insurance : 'Convênio';
};

export default function Agenda() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const navigate = (dir: number) => {
    if (viewMode === 'day') setCurrentDate(d => addDays(d, dir));
    else if (viewMode === 'week') setCurrentDate(d => addDays(d, dir * 7));
    else setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const getAppointmentsForDate = (date: Date) =>
    mockAppointments.filter(a => isSameDay(parseISO(a.date), date));

  const getPatientName = (id: string) => mockPatients.find(p => p.id === id)?.name || '';

  const selectedAppointment = selectedApt ? mockAppointments.find(a => a.id === selectedApt) : null;

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        <Button onClick={() => setShowNewModal(true)} className="medflow-btn gap-2">
          <Plus className="h-4 w-4" /> Nova Consulta
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[180px] text-center">
            {viewMode === 'day' && format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
            {viewMode === 'week' && `${format(weekStart, "d MMM", { locale: ptBR })} — ${format(addDays(weekStart, 6), "d MMM", { locale: ptBR })}`}
            {viewMode === 'month' && format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
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
                    {apts.sort((a, b) => a.time.localeCompare(b.time)).map(apt => (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedApt(apt.id)}
                        className={`p-2 rounded-lg border-l-4 cursor-pointer text-xs transition-all hover:scale-[1.02] ${statusColors[apt.status]}`}
                      >
                        <p className="font-semibold">{apt.time}</p>
                        <p className="truncate">{getPatientName(apt.patient_id)}</p>
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
            const apts = mockAppointments.filter(
              a => a.date === format(currentDate, 'yyyy-MM-dd') && a.time.startsWith(hour.split(':')[0])
            );
            return (
              <div key={hour} className="flex gap-3 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground w-12 pt-1">{hour}</span>
                <div className="flex-1 space-y-1">
                  {apts.map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedApt(apt.id)}
                      className={`p-3 rounded-xl border-l-4 cursor-pointer transition-all hover:scale-[1.01] ${statusColors[apt.status]}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{getPatientName(apt.patient_id)}</p>
                          <p className="text-xs text-muted-foreground">{apt.time} — {apt.duration_minutes}min</p>
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
                      {apts.slice(0, 3).map(a => (
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
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">Paciente:</span> {getPatientName(selectedAppointment.patient_id)}</p>
                <p className="text-sm"><span className="font-medium">Data:</span> {format(parseISO(selectedAppointment.date), "d 'de' MMMM, yyyy", { locale: ptBR })}</p>
                <p className="text-sm"><span className="font-medium">Horário:</span> {selectedAppointment.time} ({selectedAppointment.duration_minutes}min)</p>
                <p className="text-sm"><span className="font-medium">Tipo:</span> <span className="capitalize">{selectedAppointment.type}</span></p>
                <p className="text-sm"><span className="font-medium">Status:</span> <Badge className={`${statusColors[selectedAppointment.status]} border-0 ml-1`}>{statusLabels[selectedAppointment.status]}</Badge></p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" className="medflow-btn">Iniciar Atendimento</Button>
                <Button size="sm" variant="outline" className="medflow-btn">Editar</Button>
                <Button size="sm" variant="outline" className="medflow-btn text-destructive">Cancelar</Button>
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
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>
                  {mockPatients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input type="time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select defaultValue="30">
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
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Convênio</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                <SelectContent>
                  {INSURANCE_OPTIONS.map(ins => (
                    <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Observações opcionais..." />
            </div>
            <Button className="w-full medflow-btn" onClick={() => setShowNewModal(false)}>Agendar Consulta</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
