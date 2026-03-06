import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';

export default function Settings() {
  const { user, doctor, refreshDoctor } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    crm: '',
    avg_consultation_price: '',
    clinic_address: '',
    pix_key: '',
    faq_notes: '',
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        specialty: doctor.specialty || '',
        crm: doctor.crm || '',
        avg_consultation_price: doctor.avg_consultation_price ? String(doctor.avg_consultation_price) : '',
        clinic_address: doctor.clinic_address || '',
        pix_key: doctor.pix_key || '',
        faq_notes: doctor.faq_notes || '',
      });
    }
  }, [doctor]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          name: formData.name,
          specialty: formData.specialty,
          crm: formData.crm,
          avg_consultation_price: formData.avg_consultation_price ? parseFloat(formData.avg_consultation_price) : null,
          clinic_address: formData.clinic_address,
          pix_key: formData.pix_key,
          faq_notes: formData.faq_notes,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshDoctor();
      toast({ title: 'Configurações atualizadas com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações e IA</h1>
        <p className="text-muted-foreground">Gerencie os dados da sua clínica para alimentar o assistente digital.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil Profissional</CardTitle>
          <CardDescription>Estes dados aparecem nos seus documentos e agendamentos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="Dr. João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Input
                value={formData.specialty}
                onChange={(e) => setFormData(f => ({ ...f, specialty: e.target.value }))}
                placeholder="Ex: endocrinologia, pediatria"
              />
            </div>
            <div className="space-y-2">
              <Label>CRM</Label>
              <Input
                value={formData.crm}
                onChange={(e) => setFormData(f => ({ ...f, crm: e.target.value }))}
                placeholder="Ex: 123456-SP"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base de Conhecimento da Secretária IA</CardTitle>
          <CardDescription>
            A inteligência artificial do WhatsApp usará as informações abaixo para responder dúvidas dos pacientes e facilitar agendamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Endereço da Clínica (Onde atende?)</Label>
              <Input
                value={formData.clinic_address}
                onChange={(e) => setFormData(f => ({ ...f, clinic_address: e.target.value }))}
                placeholder="Ex: Av. Paulista, 1000 - Sala 45"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Base da Consulta (R$)</Label>
              <Input
                type="number"
                value={formData.avg_consultation_price}
                onChange={(e) => setFormData(f => ({ ...f, avg_consultation_price: e.target.value }))}
                placeholder="Ex: 350.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Chave PIX (Para adiantamentos)</Label>
              <Input
                value={formData.pix_key}
                onChange={(e) => setFormData(f => ({ ...f, pix_key: e.target.value }))}
                placeholder="CNPJ, Celular ou E-mail"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Notas Extras e Dúvidas Frequentes (FAQ)</Label>
            <Textarea
              rows={5}
              value={formData.faq_notes}
              onChange={(e) => setFormData(f => ({ ...f, faq_notes: e.target.value }))}
              placeholder="Escreva como o bot deve se comportar. Ex: 'Atendemos apenas convênio Sulamérica e Bradesco. O prédio tem estacionamento com valet no valor de R$30. Não fazemos encaixes de emergência.'"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="medflow-btn min-w-[150px]">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}