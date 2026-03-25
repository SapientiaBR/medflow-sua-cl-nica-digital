import { useState, useMemo } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { ImportPatients } from '@/components/ImportPatients';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
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
import { useToast } from '@/hooks/use-toast';

const INSURANCE_OPTIONS = ['Sulamérica', 'Unimed', 'Care Plus', 'Amil', 'Alice', 'Bradesco'];

export default function Patients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterInsurance, setFilterInsurance] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const navigate = useNavigate();

  const [newPatient, setNewPatient] = useState({
    name: '', phone: '', email: '', cpf: '', birth_date: '', gender: '', blood_type: '', insurance: '', allergies: '', notes: ''
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', 'full'],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('*').order('name');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: lastAppointments = {} } = useQuery({
    queryKey: ['patients', 'lastAppointments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('patient_id, date')
        .eq('status', 'realizada')
        .order('date', { ascending: false });
      const map: Record<string, string> = {};
      (data || []).forEach((a: any) => { if (!map[a.patient_id]) map[a.patient_id] = a.date; });
      return map;
    },
    enabled: !!user,
  });

  const createPatient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('patients').insert({
        doctor_id: user!.id,
        name: newPatient.name,
        phone: newPatient.phone,
        email: newPatient.email || null,
        cpf: newPatient.cpf || null,
        birth_date: newPatient.birth_date,
        gender: newPatient.gender,
        blood_type: newPatient.blood_type || null,
        insurance: newPatient.insurance || null,
        allergies: newPatient.allergies || null,
        notes: newPatient.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowNewModal(false);
      setNewPatient({ name: '', phone: '', email: '', cpf: '', birth_date: '', gender: '', blood_type: '', insurance: '', allergies: '', notes: '' });
      toast({ title: 'Paciente cadastrado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const filtered = useMemo(() =>
    patients.filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesInsurance = filterInsurance === 'all' || p.insurance === filterInsurance;
      return matchesSearch && matchesInsurance;
    }),
    [patients, search, filterInsurance]
  );

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <PageTransition>
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
        <div className="flex gap-2">
          <ImportPatients onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patients'] })} />
          <Button onClick={() => setShowNewModal(true)} className="medflow-btn gap-2">
            <Plus className="h-4 w-4" /> Novo Paciente
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterInsurance} onValueChange={setFilterInsurance}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {INSURANCE_OPTIONS.map(ins => (
              <SelectItem key={ins} value={ins}>{ins}</SelectItem>
            ))}
            <SelectItem value="Particular">Particular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((patient: any) => {
          const age = differenceInYears(new Date(), parseISO(patient.birth_date));
          const lastDate = lastAppointments[patient.id];
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
                {lastDate && (
                  <p className="text-xs text-muted-foreground">
                    Última: {format(parseISO(lastDate), 'dd/MM/yy')}
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
            <div className="space-y-2"><Label>Nome Completo</Label><Input placeholder="Nome do paciente" value={newPatient.name} onChange={e => setNewPatient(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(11) 99999-0000" value={newPatient.phone} onChange={e => setNewPatient(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@email.com" value={newPatient.email} onChange={e => setNewPatient(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>CPF</Label><Input placeholder="000.000.000-00" value={newPatient.cpf} onChange={e => setNewPatient(f => ({ ...f, cpf: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Data de Nascimento</Label><Input type="date" value={newPatient.birth_date} onChange={e => setNewPatient(f => ({ ...f, birth_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={newPatient.gender} onValueChange={v => setNewPatient(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo Sanguíneo</Label>
                <Select value={newPatient.blood_type} onValueChange={v => setNewPatient(f => ({ ...f, blood_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Convênio</Label>
              <Select value={newPatient.insurance} onValueChange={v => setNewPatient(f => ({ ...f, insurance: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                <SelectContent>
                  {INSURANCE_OPTIONS.map(ins => (
                    <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                  ))}
                  <SelectItem value="Particular">Particular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Alergias</Label><Input placeholder="Penicilina, Dipirona..." value={newPatient.allergies} onChange={e => setNewPatient(f => ({ ...f, allergies: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Observações gerais..." value={newPatient.notes} onChange={e => setNewPatient(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button
              className="w-full medflow-btn"
              disabled={!newPatient.name || !newPatient.birth_date || !newPatient.gender || createPatient.isPending}
              onClick={() => createPatient.mutate()}
            >
              {createPatient.isPending ? 'Cadastrando...' : 'Cadastrar Paciente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
}
