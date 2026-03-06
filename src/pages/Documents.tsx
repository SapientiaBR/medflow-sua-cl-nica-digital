import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { FileText, Plus, Download, Send, Search, Printer, Eye, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const typeLabels: Record<string, string> = {
  receita: 'Receita', relatorio: 'Relatório', atestado: 'Atestado', pedido_exame: 'Pedido de Exame',
};

const typeColors: Record<string, string> = {
  receita: 'bg-primary/10 text-primary',
  relatorio: 'bg-info/10 text-info',
  atestado: 'bg-warning/10 text-warning',
  pedido_exame: 'bg-secondary/10 text-secondary',
};

export default function Documents() {
  const { user, doctor } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [newDoc, setNewDoc] = useState({ type: '', patient_id: '', title: '', content: '' });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('*, patients(name, phone, email)')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, name').order('name');
      return data || [];
    },
    enabled: !!user,
  });

  const createDocument = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('documents').insert({
        doctor_id: user!.id,
        patient_id: newDoc.patient_id,
        type: newDoc.type as any,
        title: newDoc.title,
        content: { texto: newDoc.content },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowNew(false);
      setNewDoc({ type: '', patient_id: '', title: '', content: '' });
      toast({ title: 'Documento criado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const filtered = documents.filter((d: any) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.patients?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getDocContent = (doc: any): string => {
    if (!doc?.content) return '';
    if (typeof doc.content === 'string') return doc.content;
    return doc.content.texto || JSON.stringify(doc.content, null, 2);
  };

  const handleWhatsApp = (doc: any) => {
    const phone = doc.patients?.phone?.replace(/\D/g, '');
    if (!phone) {
      toast({ title: 'Paciente sem telefone cadastrado', variant: 'destructive' });
      return;
    }
    const text = encodeURIComponent(`*${doc.title}*\n\n${getDocContent(doc)}\n\n— Dra. ${doctor?.name}`);
    window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
  };

  const handleEmail = (doc: any) => {
    const email = doc.patients?.email;
    if (!email) {
      toast({ title: 'Paciente sem email cadastrado', variant: 'destructive' });
      return;
    }
    const subject = encodeURIComponent(doc.title);
    const body = encodeURIComponent(`${getDocContent(doc)}\n\n— Dra. ${doctor?.name}`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handlePrint = (doc: any) => {
    const content = getDocContent(doc);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${doc.title}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 18px; margin: 0; }
        .header p { font-size: 12px; color: #666; margin: 4px 0; }
        .badge { display: inline-block; background: #e0f2f1; color: #0d9488; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-bottom: 16px; }
        .content { white-space: pre-wrap; line-height: 1.8; font-size: 14px; }
        .patient { font-size: 13px; color: #555; margin-bottom: 16px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 16px; }
      </style></head><body>
        <div class="header"><h1>Dra. ${doctor?.name}</h1><p>${doctor?.crm} • ${doctor?.specialty}</p></div>
        <span class="badge">${typeLabels[doc.type] || doc.type}</span>
        <p class="patient"><strong>Paciente:</strong> ${doc.patients?.name || '—'}</p>
        <h2 style="font-size:16px">${doc.title}</h2>
        <div class="content">${content}</div>
        <div class="footer">Documento gerado em ${format(parseISO(doc.created_at), 'dd/MM/yyyy HH:mm')}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
        <Button onClick={() => setShowNew(true)} className="medflow-btn gap-2">
          <Plus className="h-4 w-4" /> Novo Documento
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar documento..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((doc: any) => (
          <div
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className="medflow-card flex items-center gap-3 cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
          >
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{doc.title}</p>
              <p className="text-xs text-muted-foreground">{doc.patients?.name} • {format(parseISO(doc.created_at), 'dd/MM/yyyy')}</p>
            </div>
            <Badge className={`${typeColors[doc.type]} border-0 text-xs`}>{typeLabels[doc.type]}</Badge>
            {doc.sent_via && <Badge variant="outline" className="text-xs capitalize">{doc.sent_via}</Badge>}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum documento encontrado</p>
          </div>
        )}
      </div>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedDoc?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${typeColors[selectedDoc.type]} border-0`}>{typeLabels[selectedDoc.type]}</Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedDoc.patients?.name} • {format(parseISO(selectedDoc.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>

              <div className="border rounded-xl p-6 bg-card">
                <div className="text-center border-b pb-4 mb-4">
                  <p className="font-bold text-foreground">Dra. {doctor?.name}</p>
                  <p className="text-xs text-muted-foreground">{doctor?.crm} • {doctor?.specialty}</p>
                </div>
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                  {getDocContent(selectedDoc)}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button className="medflow-btn gap-2 flex-1" onClick={() => handlePrint(selectedDoc)}>
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" className="medflow-btn gap-2 flex-1" onClick={() => handleWhatsApp(selectedDoc)}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
                <Button variant="outline" className="medflow-btn gap-2 flex-1" onClick={() => handleEmail(selectedDoc)}>
                  <Mail className="h-4 w-4" /> Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Document Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newDoc.type} onValueChange={v => setNewDoc(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="atestado">Atestado</SelectItem>
                    <SelectItem value="relatorio">Relatório</SelectItem>
                    <SelectItem value="pedido_exame">Pedido de Exame</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select value={newDoc.patient_id} onValueChange={v => setNewDoc(f => ({ ...f, patient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Título</Label><Input placeholder="Título do documento" value={newDoc.title} onChange={e => setNewDoc(f => ({ ...f, title: e.target.value }))} /></div>

            <div className="border rounded-xl p-6 bg-card space-y-4">
              <div className="text-center border-b pb-4">
                <p className="font-bold text-foreground">Dra. {doctor?.name}</p>
                <p className="text-xs text-muted-foreground">{doctor?.crm} • {doctor?.specialty}</p>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea placeholder="Escreva o conteúdo do documento..." rows={8} value={newDoc.content} onChange={e => setNewDoc(f => ({ ...f, content: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                className="medflow-btn gap-2 flex-1"
                disabled={!newDoc.type || !newDoc.patient_id || !newDoc.title || createDocument.isPending}
                onClick={() => createDocument.mutate()}
              >
                <Download className="h-4 w-4" /> {createDocument.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}