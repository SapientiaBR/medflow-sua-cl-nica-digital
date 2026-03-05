import { useState, useMemo } from 'react';
import { mockPatients, mockAppointments } from '@/data/mock';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Plus, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function Patients() {
  const [search, setSearch] = useState('');
  const [filterInsurance, setFilterInsurance] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() =>
    mockPatients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesInsurance = filterInsurance === 'all' || p.insurance === filterInsurance;
      return matchesSearch && matchesInsurance;
    }),
    [search, filterInsurance]
  );

  const insurances = [...new Set(mockPatients.map(p => p.insurance).filter(Boolean))];

  const getLastAppointment = (patientId: string) => {
    const apts = mockAppointments
      .filter(a => a.patient_id === patientId && a.status === 'realizada')
      .sort((a, b) => b.date.localeCompare(a.date));
    return apts[0];
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
        <Button onClick={() => setShowNewModal(true)} className="medflow-btn gap-2">
          <Plus className="h-4 w-4" /> Novo Paciente
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterInsurance} onValueChange={setFilterInsurance}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {insurances.map(ins => (
              <SelectItem key={ins} value={ins!}>{ins}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Patient List */}
      <div className="space-y-2">
        {filtered.map(patient => {
          const age = differenceInYears(new Date(), parseISO(patient.birth_date));
          const lastApt = getLastAppointment(patient.id);
          return (
            <div
              key={patient.id}
              onClick={() => navigate(`/pacientes/${patient.id}`)}
              className="medflow-card flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{getInitials(patient.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{patient.name}</p>
                <p className="text-xs text-muted-foreground">{age} anos • {patient.gender}</p>
              </div>
              <div className="text-right shrink-0">
                {patient.insurance && (
                  <Badge variant="outline" className="mb-1 text-xs">{patient.insurance}</Badge>
                )}
                {lastApt && (
                  <p className="text-xs text-muted-foreground">
                    Última: {format(parseISO(lastApt.date), 'dd/MM/yy')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum paciente encontrado</p>
          </div>
        )}
      </div>

      {/* New Patient Dialog */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Paciente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome Completo</Label><Input placeholder="Nome do paciente" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(11) 99999-0000" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@email.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>CPF</Label><Input placeholder="000.000.000-00" /></div>
              <div className="space-y-2"><Label>Data de Nascimento</Label><Input type="date" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo Sanguíneo</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Convênio</Label><Input placeholder="Nome do convênio" /></div>
            <div className="space-y-2"><Label>Alergias</Label><Input placeholder="Penicilina, Dipirona..." /></div>
            <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Observações gerais..." /></div>
            <Button className="w-full medflow-btn" onClick={() => setShowNewModal(false)}>Cadastrar Paciente</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
