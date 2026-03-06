import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Phone, Mail, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';

const INSURANCE_OPTIONS = ['Sulamérica', 'Unimed', 'Care Plus', 'Amil', 'Alice', 'Bradesco'];

const statusLabels: Record<string, string> = {
  agendada: 'Agendada', confirmada: 'Confirmada', realizada: 'Realizada', cancelada: 'Cancelada', faltou: 'Faltou',
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { doctor, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('*').eq('id', id).single();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: async () => {
      const { data } = await supabase.from('appointments').select('*').eq('patient_id', id).order('date', { ascending: false });
      return data || [];
    },
    enabled: !!id && !!user,
  });

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ['patient-documents', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('*').eq('patient_id', id!).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!user,
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ['patient-records', id],
    queryFn: async () => {
      const { data } = await supabase.from('medical_records').select('*').eq('patient_id', id).order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!id && !!user,
  });

  const [editForm, setEditForm] = useState<any>(null);

  // Initialize form when patient loads
  if (patient && !editForm) {
    setEditForm({ ...patient });
  }

  const updatePatient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('patients').update({
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email || null,
        cpf: editForm.cpf || null,
        birth_date: editForm.birth_date,
        insurance: editForm.insurance || null,
        blood_type: editForm.blood_type || null,
        allergies: editForm.allergies || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({ title: 'Dados atualizados!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  // Process evolution data - must be before early returns to respect hooks rules
  const evolutionData = useMemo(() => {
    return medicalRecords.map((record: any) => {
      const date = format(parseISO(record.created_at), 'dd/MM');
      const content = record.content || {};
      return {
        data: date,
        glicemia: content.exam_Glicemia_Jejum ? content.glicemia_val : content.glicemia || null,
        imc: content.imc || (content.peso && content.altura ? (content.peso / (content.altura ** 2)).toFixed(1) : null),
        peso: content.peso || null,
        altura_uterina: content.au || null,
        perimetro_cefalico: content.pc || null,
        estatura: content.altura || null,
      };
    });
  }, [medicalRecords]);

  if (isLoading) return <div className="text-center py-20 text-muted-foreground">Carregando...</div>;
  if (!patient) return <div className="text-center py-20 text-muted-foreground">Paciente não encontrado</div>;

  const age = differenceInYears(new Date(), parseISO(patient.birth_date));
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const specialty = doctor?.specialty || 'endocrinologia';

  // Process evolution data from medical records
  const evolutionData = useMemo(() => {
    return medicalRecords.map((record: any) => {
      const date = format(parseISO(record.created_at), 'dd/MM');
      const content = record.content || {};
      return {
        data: date,
        glicemia: content.exam_Glicemia_Jejum ? content.glicemia_val : content.glicemia || null, // Handle both structures
        imc: content.imc || (content.peso && content.altura ? (content.peso / (content.altura ** 2)).toFixed(1) : null),
        peso: content.peso || null,
        altura_uterina: content.au || null,
        perimetro_cefalico: content.pc || null,
        estatura: content.altura || null,
      };
    });
  }, [medicalRecords]);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pacientes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{getInitials(patient.name)}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">{age} anos • {patient.gender} • {patient.blood_type || '—'}</p>
          </div>
        </div>
        {patient.allergies && (
          <Badge className="bg-destructive/10 text-destructive border-0 gap-1">
            <AlertTriangle className="h-3 w-3" /> {patient.allergies}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="dados">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4">
          {editForm && (
            <div className="medflow-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={editForm.phone} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={editForm.email || ''} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>CPF</Label><Input value={editForm.cpf || ''} onChange={e => setEditForm((f: any) => ({ ...f, cpf: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Data Nascimento</Label><Input type="date" value={editForm.birth_date} onChange={e => setEditForm((f: any) => ({ ...f, birth_date: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Convênio</Label>
                  <Select value={editForm.insurance || ''} onValueChange={v => setEditForm((f: any) => ({ ...f, insurance: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                    <SelectContent>
                      {INSURANCE_OPTIONS.map(ins => (
                        <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                      ))}
                      <SelectItem value="Particular">Particular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Tipo Sanguíneo</Label><Input value={editForm.blood_type || ''} onChange={e => setEditForm((f: any) => ({ ...f, blood_type: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Alergias</Label><Input value={editForm.allergies || ''} onChange={e => setEditForm((f: any) => ({ ...f, allergies: e.target.value }))} /></div>
              </div>
              <Button className="medflow-btn" onClick={() => updatePatient.mutate()} disabled={updatePatient.isPending}>
                {updatePatient.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4 space-y-2">
          {appointments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma consulta registrada</p>
          ) : appointments.map((apt: any) => (
            <div key={apt.id} className="medflow-card flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{format(parseISO(apt.date), "d 'de' MMMM, yyyy", { locale: ptBR })} — {apt.time?.slice(0, 5)}</p>
                <p className="text-xs text-muted-foreground capitalize">{apt.type} • {apt.duration_minutes}min</p>
              </div>
              <Badge variant="outline" className="text-xs">{statusLabels[apt.status]}</Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="documentos" className="mt-4 space-y-2">
          <Button className="medflow-btn gap-2 mb-2" onClick={() => navigate('/documentos')}>
            <FileText className="h-4 w-4" /> Novo Documento
          </Button>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum documento</p>
          ) : documents.map((doc: any) => (
            <div key={doc.id} className="medflow-card flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{doc.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{doc.type.replace('_', ' ')} • {format(parseISO(doc.created_at), 'dd/MM/yyyy')}</p>
              </div>
              {doc.sent_via && <Badge variant="outline" className="text-xs capitalize">{doc.sent_via}</Badge>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="evolucao" className="mt-4 space-y-4">
          {evolutionData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Dados insuficientes para gerar gráficos</p>
          ) : (
            <>
              {specialty === 'endocrinologia' && (
                <>
                  <div className="medflow-card">
                    <h3 className="font-semibold mb-3">Evolução Glicêmica (mg/dL)</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                          <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="glicemia" stroke="hsl(174, 84%, 32%)" strokeWidth={2} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="medflow-card">
                    <h3 className="font-semibold mb-3">Evolução IMC</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                          <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line type="monotone" dataKey="imc" stroke="hsl(172, 66%, 40%)" strokeWidth={2} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {specialty === 'obstetricia' && (
                <>
                  <div className="medflow-card">
                    <h3 className="font-semibold mb-3">Altura Uterina (cm)</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                          <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="altura_uterina" stroke="hsl(174, 84%, 32%)" strokeWidth={2} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="medflow-card">
                    <h3 className="font-semibold mb-3">Peso Materno (kg)</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                          <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line type="monotone" dataKey="peso" stroke="hsl(172, 66%, 40%)" strokeWidth={2} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {specialty === 'pediatria' && (
                <>
                  <div className="medflow-card">
                    <h3 className="font-semibold mb-3">Peso (kg)</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                          <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line type="monotone" dataKey="peso" stroke="hsl(174, 84%, 32%)" strokeWidth={2} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="medflow-card">
                    <h3 className="font-semibold mb-3">Perímetro Cefálico (cm)</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                          <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line type="monotone" dataKey="perimetro_cefalico" stroke="hsl(172, 66%, 40%)" strokeWidth={2} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
