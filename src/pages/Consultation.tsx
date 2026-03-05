import { useParams, useNavigate } from 'react-router-dom';
import { mockAppointments, mockPatients } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInYears, parseISO } from 'date-fns';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

export default function Consultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { doctor } = useAuth();

  const appointment = mockAppointments.find(a => a.id === appointmentId);
  const patient = appointment ? mockPatients.find(p => p.id === appointment.patient_id) : null;

  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');

  if (!appointment || !patient) {
    return <div className="text-center py-20 text-muted-foreground">Consulta não encontrada</div>;
  }

  const age = differenceInYears(new Date(), parseISO(patient.birth_date));
  const imc = peso && altura ? (parseFloat(peso) / (parseFloat(altura) ** 2)).toFixed(1) : '—';
  const specialty = doctor?.specialty || 'endocrinologia';

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Atendimento</h1>
          <p className="text-sm text-muted-foreground">{patient.name} • {age} anos • {patient.insurance || 'Particular'}</p>
        </div>
        {patient.allergies && (
          <Badge className="bg-destructive/10 text-destructive border-0 gap-1">
            <AlertTriangle className="h-3 w-3" /> {patient.allergies}
          </Badge>
        )}
      </div>

      {/* Endocrinologia Form */}
      {specialty === 'endocrinologia' && (
        <div className="space-y-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Anamnese Endócrina</h2>
            <div className="space-y-2"><Label>Queixa Principal</Label><Textarea placeholder="Descreva a queixa..." /></div>
            <div className="space-y-2"><Label>História da Moléstia Atual</Label><Textarea placeholder="HMA..." /></div>
            <div className="space-y-2"><Label>Medicamentos em Uso</Label><Textarea placeholder="Medicamentos..." /></div>
            <div className="space-y-2"><Label>Antecedentes</Label><Textarea placeholder="Antecedentes pessoais e familiares..." /></div>
          </div>

          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Exame Físico</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="0.0" />
              </div>
              <div className="space-y-2">
                <Label>Altura (m)</Label>
                <Input type="number" step="0.01" value={altura} onChange={e => setAltura(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>IMC</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">{imc}</div>
              </div>
              <div className="space-y-2">
                <Label>PA (mmHg)</Label>
                <Input placeholder="120/80" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>FC (bpm)</Label>
              <Input type="number" placeholder="72" className="w-32" />
            </div>
          </div>

          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Exames Solicitados</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['TSH', 'T4 Livre', 'Anti-TPO', 'Glicemia Jejum', 'HbA1c', 'Insulina', 'Colesterol Total', 'HDL', 'LDL', 'Triglicérides', 'Cortisol', 'Vitamina D'].map(exam => (
                <div key={exam} className="flex items-center gap-2">
                  <Checkbox id={exam} />
                  <label htmlFor={exam} className="text-sm">{exam}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Conduta</h2>
            <div className="space-y-2"><Label>Plano Terapêutico</Label><Textarea placeholder="Conduta e orientações..." rows={4} /></div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="medflow-btn flex-1">Gerar Receita</Button>
            <Button variant="outline" className="medflow-btn flex-1">Gerar Pedido de Exames</Button>
          </div>
        </div>
      )}

      {/* Obstetrícia Form */}
      {specialty === 'obstetricia' && (
        <div className="space-y-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Pré-Natal</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-2"><Label>DUM</Label><Input type="date" /></div>
              <div className="space-y-2"><Label>IG (semanas)</Label><div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm">—</div></div>
              <div className="space-y-2"><Label>DPP</Label><div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm">—</div></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" placeholder="0.0" /></div>
              <div className="space-y-2"><Label>PA</Label><Input placeholder="120/80" /></div>
              <div className="space-y-2"><Label>Altura Uterina (cm)</Label><Input type="number" placeholder="0" /></div>
              <div className="space-y-2"><Label>BCF (bpm)</Label><Input type="number" placeholder="0" /></div>
            </div>
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Conduta</h2>
            <Textarea placeholder="Notas e orientações..." rows={4} />
          </div>
          <Button variant="outline" className="medflow-btn w-full">Atualizar Cartão Gestante</Button>
        </div>
      )}

      {/* Pediatria Form */}
      {specialty === 'pediatria' && (
        <div className="space-y-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Antropometria</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" placeholder="0.0" /></div>
              <div className="space-y-2"><Label>Altura (cm)</Label><Input type="number" placeholder="0" /></div>
              <div className="space-y-2"><Label>P. Cefálico (cm)</Label><Input type="number" placeholder="0" /></div>
            </div>
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Desenvolvimento</h2>
            <Textarea placeholder="Marcos neuropsicomotores..." rows={3} />
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Alimentação</h2>
            <Textarea placeholder="Amamentação, fórmula, introdução alimentar..." rows={3} />
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Conduta</h2>
            <Textarea placeholder="Orientações e prescrições..." rows={4} />
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button className="w-full medflow-btn text-lg py-6" onClick={() => navigate(-1)}>
        Salvar e Finalizar Consulta
      </Button>
    </div>
  );
}
