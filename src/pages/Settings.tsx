import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope, Clock, Shield, MessageSquare, CreditCard, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const INSURANCE_OPTIONS = ['Sulamérica', 'Unimed', 'Care Plus', 'Amil', 'Alice', 'Bradesco'];

export default function Settings() {
  const { doctor, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [insurances, setInsurances] = useState(doctor?.accepted_insurances || []);
  const [form, setForm] = useState({
    name: doctor?.name || '',
    email: doctor?.email || '',
    crm: doctor?.crm || '',
    phone: doctor?.phone || '',
    whatsapp_number: doctor?.whatsapp_number || '',
    avg_consultation_price: doctor?.avg_consultation_price?.toString() || '350',
  });

  const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const DAY_KEYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const initWorkingHours = () => {
    const wh: Record<string, { active: boolean; inicio: string; fim: string }> = {};
    DAY_KEYS.forEach(key => {
      const h = (doctor?.working_hours as any)?.[key];
      wh[key] = { active: !!h, inicio: h?.inicio || '08:00', fim: h?.fim || '18:00' };
    });
    return wh;
  };
  const [workingHours, setWorkingHours] = useState(initWorkingHours);

  // IA config state
  const [iaForm, setIaForm] = useState({
    evolution_api_url: '',
    evolution_api_key: '',
    evolution_instance_id: '',
    ai_active: false,
    ai_tone: 'profissional e acolhedor',
    ai_instructions: 'Você é a Secretária Digital do consultório. Seu objetivo é ajudar pacientes com agendamentos, dúvidas sobre endereços e convênios.',
  });

  const { data: iaConfig, isLoading: iaLoading } = useQuery({
    queryKey: ['integrations-config', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('integrations_config').select('*').eq('doctor_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (iaConfig) {
      setIaForm({
        evolution_api_url: iaConfig.evolution_api_url || '',
        evolution_api_key: iaConfig.evolution_api_key || '',
        evolution_instance_id: iaConfig.evolution_instance_id || '',
        ai_active: iaConfig.ai_active || false,
        ai_tone: iaConfig.ai_tone || 'profissional e acolhedor',
        ai_instructions: iaConfig.ai_instructions || '',
      });
    }
  }, [iaConfig]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('doctors').update({
        name: form.name,
        phone: form.phone,
        whatsapp_number: form.whatsapp_number || null,
        accepted_insurances: insurances,
        avg_consultation_price: form.avg_consultation_price ? parseFloat(form.avg_consultation_price) : null,
      }).eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Perfil atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const updateWorkingHours = useMutation({
    mutationFn: async () => {
      const payload: Record<string, { inicio: string; fim: string }> = {};
      DAY_KEYS.forEach(key => {
        if (workingHours[key].active) {
          payload[key] = { inicio: workingHours[key].inicio, fim: workingHours[key].fim };
        }
      });
      const { error } = await supabase.from('doctors').update({ working_hours: payload }).eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor'] });
      toast({ title: 'Horários salvos!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const saveIaConfig = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('integrations_config').upsert({
        doctor_id: user!.id,
        evolution_api_url: iaForm.evolution_api_url || null,
        evolution_api_key: iaForm.evolution_api_key || null,
        evolution_instance_id: iaForm.evolution_instance_id || null,
        ai_active: iaForm.ai_active,
        ai_tone: iaForm.ai_tone,
        ai_instructions: iaForm.ai_instructions,
      }, { onConflict: 'doctor_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations-config'] });
      toast({ title: 'Configurações da IA salvas!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      <Tabs defaultValue="perfil">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="perfil" className="text-xs">Perfil</TabsTrigger>
          <TabsTrigger value="horarios" className="text-xs">Horários</TabsTrigger>
          <TabsTrigger value="convenios" className="text-xs">Convênios</TabsTrigger>
          <TabsTrigger value="ia" className="text-xs">Secretária IA</TabsTrigger>
          <TabsTrigger value="plano" className="text-xs">Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-4">
          <div className="medflow-card space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Dra. {doctor?.name}</p>
                <p className="text-sm text-muted-foreground">{doctor?.crm}</p>
                <Button variant="outline" size="sm" className="mt-2 medflow-btn">Alterar Foto</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} disabled /></div>
              <div className="space-y-2"><Label>CRM</Label><Input value={form.crm} disabled /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Especialidade</Label><Input value={doctor?.specialty || ''} disabled className="capitalize" /></div>
              <div className="space-y-2"><Label>Valor Médio da Consulta (R$)</Label><Input type="number" min="0" step="0.01" value={form.avg_consultation_price} onChange={e => setForm(f => ({ ...f, avg_consultation_price: e.target.value }))} placeholder="350.00" /></div>
            </div>
            <Button className="medflow-btn" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="horarios" className="mt-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Clock className="h-5 w-5" /> Horários de Atendimento</h2>
            {DAYS.map((day, i) => {
              const key = DAY_KEYS[i];
              return (
                <div key={day} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                  <span className="w-20 text-sm font-medium">{day}</span>
                  <Switch checked={workingHours[key].active} onCheckedChange={v => setWorkingHours(wh => ({ ...wh, [key]: { ...wh[key], active: v } }))} />
                  <Input value={workingHours[key].inicio} type="time" className="w-32" disabled={!workingHours[key].active} onChange={e => setWorkingHours(wh => ({ ...wh, [key]: { ...wh[key], inicio: e.target.value } }))} />
                  <span className="text-sm text-muted-foreground">até</span>
                  <Input value={workingHours[key].fim} type="time" className="w-32" disabled={!workingHours[key].active} onChange={e => setWorkingHours(wh => ({ ...wh, [key]: { ...wh[key], fim: e.target.value } }))} />
                </div>
              );
            })}
            <Button className="medflow-btn" onClick={() => updateWorkingHours.mutate()} disabled={updateWorkingHours.isPending}>
              {updateWorkingHours.isPending ? 'Salvando...' : 'Salvar Horários'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="convenios" className="mt-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Shield className="h-5 w-5" /> Convênios Aceitos</h2>
            <div className="flex flex-wrap gap-2">
              {insurances.map(ins => (
                <Badge key={ins} className="bg-primary/10 text-primary border-0 gap-1 pr-1">
                  {ins}
                  <button onClick={() => setInsurances(prev => prev.filter(i => i !== ins))} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(val) => { if (!insurances.includes(val)) setInsurances(prev => [...prev, val]); }}>
                <SelectTrigger><SelectValue placeholder="Adicionar convênio..." /></SelectTrigger>
                <SelectContent>
                  {INSURANCE_OPTIONS.filter(ins => !insurances.includes(ins)).map(ins => (
                    <SelectItem key={ins} value={ins}>{ins}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="medflow-btn" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>Salvar Convênios</Button>
          </div>
        </TabsContent>

        <TabsContent value="ia" className="mt-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Secretária IA</h2>
            
            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
              <div>
                <p className="font-medium text-foreground">Ativar Secretária IA</p>
                <p className="text-xs text-muted-foreground">Responda mensagens do WhatsApp automaticamente</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={iaForm.ai_active ? 'bg-primary text-primary-foreground border-0' : 'bg-muted text-muted-foreground border-0'}>
                  {iaForm.ai_active ? 'Ativo' : 'Inativo'}
                </Badge>
                <Switch checked={iaForm.ai_active} onCheckedChange={(v) => setIaForm(f => ({ ...f, ai_active: v }))} />
              </div>
            </div>

            <div className="space-y-4 border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground">Conexão Evolution API</h3>
              <div className="space-y-2"><Label>URL da API</Label><Input value={iaForm.evolution_api_url} onChange={e => setIaForm(f => ({ ...f, evolution_api_url: e.target.value }))} placeholder="https://sua-evolution-api.com" /></div>
              <div className="space-y-2"><Label>API Key</Label><Input type="password" value={iaForm.evolution_api_key} onChange={e => setIaForm(f => ({ ...f, evolution_api_key: e.target.value }))} placeholder="Sua chave de API" /></div>
              <div className="space-y-2"><Label>Instance ID</Label><Input value={iaForm.evolution_instance_id} onChange={e => setIaForm(f => ({ ...f, evolution_instance_id: e.target.value }))} placeholder="Nome da instância" /></div>
            </div>

            <div className="space-y-4 border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground">Comportamento da IA</h3>
              <div className="space-y-2">
                <Label>Tom de Voz</Label>
                <Select value={iaForm.ai_tone} onValueChange={(v) => setIaForm(f => ({ ...f, ai_tone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional e acolhedor">Profissional e Acolhedor</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="descontraído">Descontraído</SelectItem>
                    <SelectItem value="objetivo e direto">Objetivo e Direto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instruções da IA</Label>
                <Textarea rows={4} value={iaForm.ai_instructions} onChange={e => setIaForm(f => ({ ...f, ai_instructions: e.target.value }))} placeholder="Descreva como a IA deve se comportar..." />
              </div>
            </div>

            <Button className="medflow-btn" onClick={() => saveIaConfig.mutate()} disabled={saveIaConfig.isPending}>
              {saveIaConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="plano" className="mt-4">
          <div className="medflow-card space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><CreditCard className="h-5 w-5" /> Seu Plano</h2>
            <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 text-center">
              <Badge className="bg-primary text-primary-foreground mb-3">Free</Badge>
              <p className="text-2xl font-bold text-foreground">Plano Gratuito</p>
              <p className="text-sm text-muted-foreground mt-1">Até 30 pacientes e funcionalidades básicas</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 border rounded-xl text-center hover:border-primary transition-colors cursor-pointer">
                <p className="font-bold text-foreground">Pro</p>
                <p className="text-2xl font-bold text-primary">R$ 99<span className="text-sm">/mês</span></p>
                <p className="text-xs text-muted-foreground mt-1">Pacientes ilimitados + Secretária IA</p>
              </div>
              <div className="p-4 border rounded-xl text-center hover:border-primary transition-colors cursor-pointer">
                <p className="font-bold text-foreground">Clínica</p>
                <p className="text-2xl font-bold text-primary">R$ 249<span className="text-sm">/mês</span></p>
                <p className="text-xs text-muted-foreground mt-1">Multi-médicos + Relatórios avançados</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}