import { useParams, useNavigate } from 'react-router-dom';
import { mockPatients, mockAppointments, mockDocuments, mockMedicalRecords } from '@/data/mock';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Phone, Mail, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const statusLabels: Record<string, string> = {
  agendada: 'Agendada', confirmada: 'Confirmada', realizada: 'Realizada', cancelada: 'Cancelada', faltou: 'Faltou',
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = mockPatients.find(p => p.id === id);

  if (!patient) return <div className="text-center py-20 text-muted-foreground">Paciente não encontrado</div>;

  const age = differenceInYears(new Date(), parseISO(patient.birth_date));
  const appointments = mockAppointments.filter(a => a.patient_id === id).sort((a, b) => b.date.localeCompare(a.date));
  const documents = mockDocuments.filter(d => d.patient_id === id);
  const records = mockMedicalRecords.filter(r => r.patient_id === id);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Mock evolution data
  const evolutionData = [
    { data: '01/Jan', glicemia: 180, imc: 30.1 },
    { data: '15/Jan', glicemia: 165, imc: 29.8 },
    { data: '01/Fev', glicemia: 152, imc: 29.5 },
    { data: '15/Fev', glicemia: 140, imc: 29.2 },
    { data: '01/Mar', glicemia: 135, imc: 28.9 },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
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

      {/* Tabs */}
      <Tabs defaultValue="dados">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4">
          <div className="medflow-card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input defaultValue={patient.name} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input defaultValue={patient.phone} /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue={patient.email || ''} /></div>
              <div className="space-y-2"><Label>CPF</Label><Input defaultValue={patient.cpf || ''} /></div>
              <div className="space-y-2"><Label>Data Nascimento</Label><Input type="date" defaultValue={patient.birth_date} /></div>
              <div className="space-y-2"><Label>Convênio</Label><Input defaultValue={patient.insurance || ''} /></div>
              <div className="space-y-2"><Label>Tipo Sanguíneo</Label><Input defaultValue={patient.blood_type || ''} /></div>
              <div className="space-y-2"><Label>Alergias</Label><Input defaultValue={patient.allergies || ''} /></div>
            </div>
            <Button className="medflow-btn">Salvar Alterações</Button>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-4 space-y-2">
          {appointments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma consulta registrada</p>
          ) : appointments.map(apt => (
            <div key={apt.id} className="medflow-card flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{format(parseISO(apt.date), "d 'de' MMMM, yyyy", { locale: ptBR })} — {apt.time}</p>
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
          ) : documents.map(doc => (
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
          <div className="medflow-card">
            <h3 className="font-semibold mb-3">Glicemia de Jejum (mg/dL)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="glicemia" stroke="hsl(174, 84%, 32%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="medflow-card">
            <h3 className="font-semibold mb-3">IMC</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis domain={[25, 35]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="imc" stroke="hsl(172, 66%, 40%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
