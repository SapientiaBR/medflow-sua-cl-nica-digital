

# Conectar aba Secretária IA + corrigir build errors

## Build errors a corrigir primeiro

### 1. `Consultation.tsx` — faltam imports
- Adicionar `useMemo` ao import do React
- Adicionar `import { ptBR } from 'date-fns/locale'`

### 2. `PatientDetail.tsx` — query incompleta (linha 49-51)
- A query de `documents` não tem `queryKey` nem `queryFn` — adicionar ambos para buscar documentos do paciente

## Feature: Aba Secretária IA funcional

### Em `src/pages/Settings.tsx`:

1. **Carregar config existente** — `useQuery` para buscar `integrations_config` do doctor logado
2. **Estado local** — campos: `evolution_api_url`, `evolution_api_key`, `evolution_instance_id`, `ai_active`, `ai_tone`, `ai_instructions`
3. **Salvar** — mutation com upsert (`onConflict: 'doctor_id'`) na tabela `integrations_config`
4. **UI da aba "ia"** — substituir os inputs estáticos por inputs controlados ligados ao estado, com o switch de `ai_active` funcional e campos para URL/key/instance da Evolution API
5. **Feedback** — toast de sucesso/erro ao salvar

