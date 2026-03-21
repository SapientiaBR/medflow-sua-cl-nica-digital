import { useState, useMemo } from 'react';
import { ImportPatients } from '@/components/ImportPatients';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Plus, User, Phone, Mail, Calendar, HeartPulse, ChevronRight, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
      toast({ title: 'Paciente cadastrado!', description: 'O paciente foi adicionado à sua lista.' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const filtered = useMemo(() =>
    patients.filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search);
      const matchesInsurance = filterInsurance === 'all' || p.insurance === filterInsurance;
      return matchesSearch && matchesInsurance;
    }),
    [patients, search, filterInsurance]
  );

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const insuranceColors: Record<string, string> = {
    'Sulamérica': 'bg-blue-100 text-blue-700',
    'Unimed': 'bg-red-100 text-red-700',
    'Care Plus': 'bg-green-100 text-green-700',
    'Amil': 'bg-purple-100 text-purple-700',
    'Alice': 'bg-amber-100 text-amber-700',
    'Bradesco': 'bg-orange-100 text-orange-700',
    'Particular': 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{patients.length} pacientes cadastrados</p>
        </div>
        <div className="flex gap-2">
          <ImportPatients onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patients'] })} />
          <Button onClick={() => setShowNewModal(true)} className="medflow-btn-primary gap-2">
            <UserPlus className="h-4 w-4" /> Novo Paciente
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou telefone..." 
            className="pl-12 h-12 bg-accent/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <Select value={filterInsurance} onValueChange={setFilterInsurance}>
          <SelectTrigger className="w-full sm:w-44 h-12 rounded-xl bg-accent/30 border-0">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os convênios</SelectItem>
            {INSURANCE_OPTIONS.map(ins => (
              <SelectItem key={ins} value={ins}>{ins}</SelectItem>
            ))}
            <SelectItem value="Particular">Particular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((patient: any, index: number) => {
          const age = differenceInYears(new Date(), parseISO(patient.birth_date));
          const lastDate = lastAppointments[patient.id];
          return (
            <div
              key={patient.id}
              onClick={() => navigate(`/pacientes/${patient.id}`)}
              className="medflow-card flex items-center gap-4 cursor-pointer group animate-scale-in hover:border-primary/20"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <Avatar className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20 group-hover:from-primary/30 group-hover:via-secondary/20 group-hover:to-primary/30 transition-all">
                <AvatarFallback className="bg-transparent text-foreground font-bold text-lg">
                  {getInitials(patient.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground truncate">{patient.name}</p>
                  {patient.allergies && (
                    <HeartPulse className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {age} anos
                  </span>
                  {patient.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {patient.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                {patient.insurance && (
                  <Badge className={`${insuranceColors[patient.insurance] || 'bg-gray-100 text-gray-700'} border-0 font-medium text-xs px-2.5 py-1`}>
                    {patient.insurance}
                  </Badge>
                )}
                {patient.blood_type && (
                  <Badge variant="outline" className="text-xs font-medium">
                    {patient.blood_type}
                  </Badge>
                )}
              </div>
              <div className="hidden md:block text-right shrink-0 w-20">
                {lastDate ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Última</p>
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(lastDate), 'dd/MM/yy')}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Novo</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Nenhum paciente encontrado</p>
            <p className="text-muted-foreground text-sm mb-4">
              {search ? 'Tente buscar por outro termo' : 'Comece adicionando seu primeiro paciente'}
            </p>
            {!search && (
              <Button onClick={() => setShowNewModal(true)} className="medflow-btn-primary gap-2">
                <Plus className="h-4 w-4" /> Adicionar Paciente
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Novo Paciente</DialogTitle>
                <p className="text-sm text-muted-foreground">Preencha os dados do paciente</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome Completo *</Label>
              <Input placeholder="Nome completo do paciente" className="h-11 bg-accent/30 border-0 rounded-xl" value={newPatient.name} onChange={e => setNewPatient(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Telefone</Label>
                <Input placeholder="(11) 99999-0000" className="h-11 bg-accent/30 border-0 rounded-xl" value={newPatient.phone} onChange={e => setNewPatient(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input type="email" placeholder="email@email.com" className="h-11 bg-accent/30 border-0 rounded-xl" value={newPatient.email} onChange={e => setNewPatient(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">CPF</Label>
                <Input placeholder="000.000.000-00" className="h-11 bg-accent/30 border-0 rounded-xl" value={newPatient.cpf} onChange={e => setNewPatient(f => ({ ...f, cpf: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nascimento *</Label>
                <Input type="date" className="h-11 bg-accent/30 border-0 rounded-xl" value={newPatient.birth_date} onChange={e => setNewPatient(f => ({ ...f, birth_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gênero *</Label>
                <Select value={newPatient.gender} onValueChange={v => setNewPatient(f => ({ ...f, gender: v }))}>
                  <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo Sanguíneo</Label>
                <Select value={newPatient.blood_type} onValueChange={v => setNewPatient(f => ({ ...f, blood_type: v }))}>
                  <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Convênio</Label>
              <Select value={newPatient.insurance} onValueChange={v => setNewPatient(f => ({ ...f, insurance: v }))}>
                <SelectTrigger className="h-11 bg-accent/30 border-0 rounded-xl"><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                <SelectContent>
                  {INSURANCE_OPTIONS.map(ins => (
                    <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                  ))}
                  <SelectItem value="Particular">Particular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Alergias</Label>
              <Input placeholder="Penicilina, Dipirona..." className="h-11 bg-accent/30 border-0 rounded-xl" value={newPatient.allergies} onChange={e => setNewPatient(f => ({ ...f, allergies: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações</Label>
              <Textarea placeholder="Observações gerais..." className="bg-accent/30 border-0 rounded-xl resize-none" rows={3} value={newPatient.notes} onChange={e => setNewPatient(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button
              className="w-full medflow-btn-primary h-12 rounded-xl"
              disabled={!newPatient.name || !newPatient.birth_date || !newPatient.gender || createPatient.isPending}
              onClick={() => createPatient.mutate()}
            >
              {createPatient.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Cadastrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Cadastrar Paciente
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
