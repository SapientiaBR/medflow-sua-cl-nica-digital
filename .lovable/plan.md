

# Convênios como Dropdown — Plano

## O que mudar

Criar uma constante compartilhada `INSURANCE_OPTIONS` com os 6 convênios (SulAmérica, Unimed, Care Plus, Amil, Alice, Bradesco) + "Particular", e substituir todos os campos de convênio que hoje são `<Input>` por `<Select>` dropdown.

## Locais afetados

1. **`src/data/mock.ts`** — Criar e exportar `INSURANCE_OPTIONS` array
2. **`src/pages/Patients.tsx`** (linha 142) — Trocar `<Input>` do convênio no modal "Novo Paciente" por `<Select>` com as opções; também atualizar o filtro de convênios (linhas 56-63) para usar a lista fixa em vez de extrair dos dados
3. **`src/pages/PatientDetail.tsx`** (linha 80) — Trocar `<Input>` do convênio na aba Dados por `<Select>` com as opções
4. **`src/pages/Settings.tsx`** (linhas 80-97) — Na aba Convênios, substituir o input livre por um dropdown/checklist usando a mesma lista, permitindo selecionar quais convênios o médico aceita
5. **`src/pages/Agenda.tsx`** — Verificar se o modal de nova consulta precisa de seleção de convênio (já tem campo tipo particular/convênio, pode adicionar qual convênio)

## Após as mudanças

Testar end-to-end navegando pelas telas para confirmar que os dropdowns funcionam corretamente.

