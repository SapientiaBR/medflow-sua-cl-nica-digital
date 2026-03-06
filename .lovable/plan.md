

# Alterações no banco de dados

Executar a migração SQL solicitada com 4 partes:

1. **Adicionar `avg_consultation_price`** na tabela `doctors` (NUMERIC, default 350)
2. **Criar tabela `integrations_config`** com campos para Evolution API, configuração de IA, e RLS
3. **Políticas RLS** para SELECT, UPDATE e INSERT (doctor_id = auth.uid())
4. **Trigger `update_updated_at_column`** para atualizar `updated_at` automaticamente

Uma única migração SQL com todo o conteúdo fornecido.

