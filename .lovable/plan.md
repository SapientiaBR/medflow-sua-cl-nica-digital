

# Tornar botões do dialog de detalhes da consulta funcionais

## Problema
No dialog "Detalhes da Consulta" (Agenda), os 3 botões — **Iniciar Atendimento**, **Editar** e **Cancelar** — não têm ação nenhuma (`onClick` ausente).

## Plano

### 1. Botão "Iniciar Atendimento"
- Navegar para `/atendimento/{appointmentId}` (rota já existente para `Consultation.tsx`)
- Fechar o dialog antes de navegar

### 2. Botão "Editar" — modo de edição inline no dialog
- Adicionar estado `editingApt` com os campos editáveis (date, time, duration, type, status, notes, insurance_code)
- Quando clicar "Editar", popular o estado com dados do appointment selecionado
- Renderizar formulário de edição no dialog (reutilizando os mesmos inputs do modal de criação)
- Mutation `updateAppointment` para salvar via `supabase.from('appointments').update(...)`
- Botão "Salvar" e "Cancelar edição" dentro do modo de edição

### 3. Botão "Cancelar Consulta"
- Mutation para atualizar o status do appointment para `'cancelada'`
- Confirmar com `window.confirm()` antes de executar
- Invalidar queries e fechar dialog

### 4. Botões adicionais de status
- Adicionar botões "Confirmar" (status → `confirmada`) e "Marcar Falta" (status → `faltou`) para dar controle completo do fluxo
- Mostrar botões condicionalmente conforme o status atual (ex: não mostrar "Cancelar" se já cancelada)

### Arquivos modificados
- `src/pages/Agenda.tsx` — toda a lógica será adicionada neste arquivo

