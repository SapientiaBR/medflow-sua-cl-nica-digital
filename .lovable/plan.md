

# Salvar horários de atendimento + formatar horas sem segundos

## Contexto

A aba "Horários" em Settings usa inputs `defaultValue` não controlados e o botão "Salvar Horários" não faz nada. O campo `time` no banco é `time without time zone`, que retorna `HH:mm:ss` — precisamos exibir apenas `HH:mm` em todo o app.

## Alterações

### 1. `src/pages/Settings.tsx` — Aba Horários funcional

- Criar estado local `workingHours` inicializado a partir de `doctor?.working_hours`, com estrutura `{ [key]: { active: boolean, inicio: string, fim: string } }` para os 6 dias.
- Trocar `defaultChecked`/`defaultValue` por `checked`/`value` controlados.
- Criar mutation `updateWorkingHours` que faz `supabase.from('doctors').update({ working_hours }).eq('id', user.id)`.
- Conectar o botão "Salvar Horários" à mutation com toast de feedback.

### 2. Formatar horários sem segundos em todo o app

Nos locais que exibem `apt.time` (que vem como `HH:mm:ss`), aplicar `.slice(0, 5)` para mostrar apenas `HH:mm`:

- **`src/pages/Dashboard.tsx`** — linhas que exibem `nextAppointment.time` e `apt.time`
- **`src/pages/Agenda.tsx`** — linhas que exibem `apt.time`
- **`src/pages/PatientDetail.tsx`** — linha que exibe `apt.time`

Criar helper `formatTime(t: string) => t?.slice(0, 5)` ou aplicar `.slice(0,5)` inline.

