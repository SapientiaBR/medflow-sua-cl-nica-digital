

# Fase 2 — Integração Supabase Externo

## Passo 0: Conectar Supabase

Primeiro, conectar o projeto Supabase externo ao Lovable.

## Passo 1: Criar tabelas com migrações

5 tabelas conforme a spec original, usando migrações SQL:

**`doctors`** — `id` (uuid, FK → auth.users, PK), name, email, specialty, crm, phone, whatsapp_number, working_hours (jsonb), accepted_insurances (text[]), avatar_url, created_at

**`patients`** — id (uuid, PK), doctor_id (FK → doctors), name, phone, email, cpf, birth_date, gender, insurance, blood_type, allergies, notes, created_at

**`appointments`** — id (uuid, PK), doctor_id (FK → doctors), patient_id (FK → patients), date, time, duration_minutes, type, status, insurance_code, notes, created_at

**`medical_records`** — id (uuid, PK), appointment_id (FK → appointments), patient_id (FK → patients), doctor_id (FK → doctors), template_type, content (jsonb), created_at

**`documents`** — id (uuid, PK), patient_id (FK → patients), doctor_id (FK → doctors), appointment_id (FK → appointments), type, title, content (jsonb), file_url, sent_via, sent_at, created_at

## Passo 2: RLS (Row Level Security)

Cada tabela terá RLS habilitado. Policies simples: cada médico vê/edita apenas seus próprios registros (`doctor_id = auth.uid()` ou `id = auth.uid()` para doctors).

## Passo 3: Trigger para criar perfil do médico

Trigger `on auth.users INSERT` que cria uma linha em `doctors` automaticamente com os dados do `raw_user_meta_data`.

## Passo 4: Integrar Supabase Client

- Criar `src/integrations/supabase/client.ts` com o client configurado
- Gerar types do Supabase em `src/integrations/supabase/types.ts`

## Passo 5: Refatorar AuthContext

Substituir mock auth por Supabase Auth real:
- `signInWithPassword` para login
- `signUp` com metadata (name, crm, specialty, phone) para cadastro
- `onAuthStateChange` listener para gerenciar sessão
- Buscar dados do médico da tabela `doctors` após login

## Passo 6: Refatorar páginas para usar Supabase

Substituir imports de `mockPatients`, `mockAppointments`, etc. por queries reais usando `@tanstack/react-query` + Supabase client em cada página:
- **Dashboard**: query appointments do dia, contagens do mês
- **Agenda**: CRUD de appointments
- **Patients**: CRUD de patients
- **PatientDetail**: query patient + appointments + documents + medical_records
- **Consultation**: insert/update medical_records
- **Documents**: CRUD de documents
- **Settings**: update doctor profile

O `src/data/mock.ts` será mantido como fallback mas não mais usado ativamente.

## Ordem de execução

1. Conectar Supabase → 2. Migrações (tabelas + RLS + trigger) → 3. Client + types → 4. AuthContext → 5. Páginas uma a uma

