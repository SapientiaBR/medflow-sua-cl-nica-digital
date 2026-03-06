import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function ImportPatients({ onSuccess }: { onSuccess: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const processImport = async () => {
        if (!file || !user) return;
        setImporting(true);

        try {
            const text = await file.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const patients = lines.slice(1)
                .filter(line => line.trim().length > 0)
                .map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const p: any = { doctor_id: user.id };

                    headers.forEach((header, i) => {
                        if (header === 'nome' || header === 'name') p.name = values[i];
                        if (header === 'telefone' || header === 'phone') p.phone = values[i];
                        if (header === 'email') p.email = values[i];
                        if (header === 'cpf') p.cpf = values[i];
                        if (header === 'nascimento' || header === 'birth') p.birth_date = values[i];
                        if (header === 'genero' || header === 'gender') p.gender = values[i]?.toLowerCase() || 'feminino';
                    });

                    return p;
                })
                .filter(p => p.name && p.birth_date);

            if (patients.length === 0) {
                throw new Error('Nenhum paciente válido encontrado no arquivo.');
            }

            const { error } = await supabase.from('patients').insert(patients);
            if (error) throw error;

            toast({ title: `Sucesso!`, description: `${patients.length} pacientes importados.` });
            setOpen(false);
            setFile(null);
            onSuccess();
        } catch (err: any) {
            toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' });
        } finally {
            setImporting(false);
        }
    };

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)} className="gap-2 border-primary/20 hover:bg-primary/5">
                <Upload className="h-4 w-4" /> Importar CSV
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Pacientes</DialogTitle>
                        <DialogDescription>
                            Selecione um arquivo .csv contendo os dados dos seus pacientes.
                            As colunas devem incluir: Nome, Telefone, Nascimento, Genero.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                id="csv-upload"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="csv-upload" className="cursor-pointer space-y-2 block">
                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-10 w-10 text-primary" />
                                        <span className="font-medium">{file.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-10 w-10" />
                                        <span>Clique para selecionar o arquivo CSV</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {file && (
                            <div className="bg-primary/5 p-4 rounded-lg flex gap-3 text-sm text-primary border border-primary/10">
                                <CheckCircle2 className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Arquivo pronto para importação</p>
                                    <p>Clique no botão abaixo para processar os dados.</p>
                                </div>
                            </div>
                        )}

                        {!file && (
                            <div className="bg-amber-50 p-4 rounded-lg flex gap-3 text-sm text-amber-700 border border-amber-200">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Importante</p>
                                    <p>O arquivo deve estar no formato CSV separado por vírgulas.</p>
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full medflow-btn"
                            disabled={!file || importing}
                            onClick={processImport}
                        >
                            {importing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importando...
                                </>
                            ) : (
                                'Iniciar Importação'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
