import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInYears, parseISO, differenceInDays, addDays, format as formatDate, addMonths } from 'date-fns';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useMemo } from 'react';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function Consultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { doctor, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, patients(*)')
        .eq('id', appointmentId)
        .single();
      return data;
    },
    enabled: !!appointmentId && !!user,
  });

  const patient = appointment?.patients;

  const [form, setForm] = useState<Record<string, any>>({});
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [dum, setDum] = useState('');

  const saveMedicalRecord = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('medical_records').insert({
        appointment_id: appointmentId,
        patient_id: patient.id,
        doctor_id: user!.id,
        template_type: `anamnese_${doctor?.specialty || 'endocrinologia'}`,
        content: { ...form, peso: parseFloat(peso) || null, altura: parseFloat(altura) || null },
      });
      if (error) throw error;
      // Mark appointment as realizada
      await supabase.from('appointments').update({ status: 'realizada' as any }).eq('id', appointmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Consulta salva!' });
      navigate(-1);
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  // Obstetrics calculations (must be before early return)
  const ig = useMemo(() => {
    if (!dum) return null;
    const dumDate = parseISO(dum);
    const diffDays = differenceInDays(new Date(), dumDate);
    if (diffDays < 0) return null;
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return `${weeks} sem e ${days} dias`;
  }, [dum]);

  const dpp = useMemo(() => {
    if (!dum) return null;
    const dumDate = parseISO(dum);
    const dppDate = addDays(addMonths(dumDate, 9), 7);
    return formatDate(dppDate, 'dd/MM/yyyy', { locale: ptBR });
  }, [dum]);

  if (!appointment || !patient) {
    return <div className="text-center py-20 text-muted-foreground">Carregando consulta...</div>;
  }

  const age = differenceInYears(new Date(), parseISO(patient.birth_date));
  const imc = peso && altura ? (parseFloat(peso) / (parseFloat(altura) ** 2)).toFixed(1) : '—';
  const specialty = doctor?.specialty || 'endocrinologia';

  return (
    <div className="space-y-4 max-w-3xl">
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

      {specialty === 'endocrinologia' && (
        <div className="space-y-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Anamnese Endócrina</h2>
            <div className="space-y-2"><Label>Queixa Principal</Label><Textarea placeholder="Descreva a queixa..." onChange={e => setForm(f => ({ ...f, queixa: e.target.value }))} /></div>
            <div className="space-y-2"><Label>História da Moléstia Atual</Label><Textarea placeholder="HMA..." onChange={e => setForm(f => ({ ...f, hma: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Medicamentos em Uso</Label><Textarea placeholder="Medicamentos..." onChange={e => setForm(f => ({ ...f, medicamentos: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Antecedentes</Label><Textarea placeholder="Antecedentes pessoais e familiares..." onChange={e => setForm(f => ({ ...f, antecedentes: e.target.value }))} /></div>
          </div>

          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Exame Físico</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="0.0" /></div>
              <div className="space-y-2"><Label>Altura (m)</Label><Input type="number" step="0.01" value={altura} onChange={e => setAltura(e.target.value)} placeholder="0.00" /></div>
              <div className="space-y-2"><Label>IMC</Label><div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">{imc}</div></div>
              <div className="space-y-2"><Label>PA (mmHg)</Label><Input placeholder="120/80" onChange={e => setForm(f => ({ ...f, pa: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>FC (bpm)</Label><Input type="number" placeholder="72" className="w-32" onChange={e => setForm(f => ({ ...f, fc: e.target.value }))} /></div>
          </div>

          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Exames Solicitados</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['TSH', 'T4 Livre', 'Anti-TPO', 'Glicemia Jejum', 'HbA1c', 'Insulina', 'Colesterol Total', 'HDL', 'LDL', 'Triglicérides', 'Cortisol', 'Vitamina D'].map(exam => (
                <div key={exam} className="flex items-center gap-2">
                  <Checkbox id={exam} onCheckedChange={checked => setForm(f => ({ ...f, [`exam_${exam}`]: checked }))} />
                  <label htmlFor={exam} className="text-sm">{exam}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Conduta</h2>
            <div className="space-y-2"><Label>Plano Terapêutico</Label><Textarea placeholder="Conduta e orientações..." rows={4} onChange={e => setForm(f => ({ ...f, conduta: e.target.value }))} /></div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="medflow-btn flex-1">Gerar Receita</Button>
            <Button variant="outline" className="medflow-btn flex-1">Gerar Pedido de Exames</Button>
          </div>
        </div>
      )}

      {specialty === 'obstetricia' && (
        <div className="space-y-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Pré-Natal</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>DUM</Label>
                <Input
                  type="date"
                  value={dum}
                  onChange={e => {
                    setDum(e.target.value);
                    setForm(f => ({ ...f, dum: e.target.value }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>IG (semanas)</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">
                  {ig || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <Label>DPP</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">
                  {dpp || '—'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" placeholder="0.0" onChange={e => setPeso(e.target.value)} /></div>
              <div className="space-y-2"><Label>PA</Label><Input placeholder="120/80" onChange={e => setForm(f => ({ ...f, pa: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Altura Uterina (cm)</Label><Input type="number" placeholder="0" onChange={e => setForm(f => ({ ...f, au: e.target.value }))} /></div>
              <div className="space-y-2"><Label>BCF (bpm)</Label><Input type="number" placeholder="0" onChange={e => setForm(f => ({ ...f, bcf: e.target.value }))} /></div>
            </div>
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Conduta</h2>
            <Textarea placeholder="Notas e orientações..." rows={4} onChange={e => setForm(f => ({ ...f, conduta: e.target.value }))} />
          </div>
        </div>
      )}

      {specialty === 'pediatria' && (
        <div className="space-y-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Antropometria</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" placeholder="0.0" onChange={e => setPeso(e.target.value)} /></div>
              <div className="space-y-2"><Label>Altura (cm)</Label><Input type="number" placeholder="0" onChange={e => setAltura(e.target.value)} /></div>
              <div className="space-y-2"><Label>P. Cefálico (cm)</Label><Input type="number" placeholder="0" onChange={e => setForm(f => ({ ...f, pc: e.target.value }))} /></div>
            </div>
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Desenvolvimento</h2>
            <Textarea placeholder="Marcos neuropsicomotores..." rows={3} onChange={e => setForm(f => ({ ...f, desenvolvimento: e.target.value }))} />
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Alimentação</h2>
            <Textarea placeholder="Amamentação, fórmula, introdução alimentar..." rows={3} onChange={e => setForm(f => ({ ...f, alimentacao: e.target.value }))} />
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Calendário Vacinal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
              {[
                'BCG (Dose única)', 'Hepatite B (Ao nascer)', 'Pentavalente (2, 4, 6 meses)',
                'VIP/VOP (Pólio)', 'Rotavírus (2, 4 meses)', 'Pneumocócica 10V',
                'Meningocócica C (3, 5 meses)', 'Hepatite A (15 meses)',
                'Tríplice Viral (12, 15 meses)', 'Tetra Viral', 'DTP', 'Varicela',
                'Febre Amarela (9 meses)', 'Gripe (Anual)'
              ].map(vac => (
                <div key={vac} className="flex items-center gap-2">
                  <Checkbox
                    id={vac}
                    checked={form[`vac_${vac}`] || false}
                    onCheckedChange={checked => setForm(f => ({ ...f, [`vac_${vac}`]: checked }))}
                  />
                  <label htmlFor={vac} className="text-sm cursor-pointer">{vac}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground">Conduta</h2>
            <Textarea placeholder="Orientações e prescrições..." rows={4} onChange={e => setForm(f => ({ ...f, conduta: e.target.value }))} />
          </div>
        </div>
      )}

      <Button
        className="w-full medflow-btn text-lg py-6"
        onClick={() => saveMedicalRecord.mutate()}
        disabled={saveMedicalRecord.isPending}
      >
        {saveMedicalRecord.isPending ? 'Salvando...' : 'Salvar e Finalizar Consulta'}
      </Button>
    </div>
  );
}
