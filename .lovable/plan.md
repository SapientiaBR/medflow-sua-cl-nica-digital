

# MedFlow — Plano de Implementação

Este é um projeto grande. Vou dividi-lo em fases para entregar incrementalmente.

## Fase 1 (esta implementação): Frontend completo com dados mock

Construir toda a UI com dados de demonstração em memória, sem Supabase ainda. Isso permite validar o design e fluxo antes de conectar o backend.

### 1. Fundação e Design System

- Atualizar `index.css` com a paleta teal (#0D9488 primária, #14B8A6 secundária, #F0FDFA background, #134E4A texto)
- Adicionar fonte Inter via Google Fonts no `index.html`
- Criar CSS utilitário para cards (radius 16px, sombra suave), botões com micro-animações (scale 1.02, transition 200ms)
- Criar gradiente de background (#F0FDFA → branco)

### 2. Layout e Navegação

- **`AppLayout.tsx`**: Layout principal com sidebar desktop + bottom nav mobile
- **Bottom nav mobile**: 5 ícones (Home, Pacientes, Agenda, Documentos, Perfil) fixo no rodapé
- **Sidebar desktop**: mesmos itens, usando shadcn Sidebar com `collapsible="icon"`
- Rotas: `/`, `/pacientes`, `/pacientes/:id`, `/agenda`, `/documentos`, `/configuracoes`, `/atendimento/:appointmentId`, `/login`, `/cadastro`

### 3. Dados Mock

- `src/data/mock.ts`: 1 médico, 10 pacientes, 20 consultas, alguns prontuários e documentos
- Context provider (`AuthContext`) simulando médico logado
- Tipos TypeScript em `src/types/index.ts` para todas as entidades

### 4. Telas

- **Login/Cadastro**: Cards centralizados, logo MedFlow, campos conforme spec (sem integração Supabase ainda — login mock)
- **Dashboard**: Saudação, cards (Consultas Hoje, Próxima Consulta com countdown, Resumo do Mês, Secretária IA placeholder), gráfico de barras semanal com Recharts
- **Agenda**: Visualização semanal (default), toggle diária/mensal, cards coloridos por status, botão "+" para nova consulta (modal com formulário), clique para detalhes
- **Pacientes**: Lista com busca/filtro, ficha com 4 abas (Dados, Histórico, Documentos, Evolução com gráficos por especialidade)
- **Atendimento/Prontuário**: Formulário dinâmico por especialidade (Endocrinologia, Obstetrícia, Pediatria) conforme spec, cálculos automáticos (IMC, IG)
- **Documentos**: Lista, criação com editor simples, preview, botões de ação (PDF/WhatsApp/Email como placeholder)
- **Configurações**: Perfil, Horários, Convênios, Secretária IA (placeholder), Plano

### 5. Estrutura de Arquivos

```text
src/
├── types/index.ts
├── data/mock.ts
├── contexts/AuthContext.tsx
├── layouts/AppLayout.tsx
├── components/
│   ├── BottomNav.tsx
│   ├── AppSidebar.tsx
│   ├── dashboard/ (cards, chart)
│   ├── agenda/ (calendar views, appointment modal)
│   ├── patients/ (list, detail tabs, evolution charts)
│   ├── medical-records/ (forms by specialty)
│   └── documents/ (editor, preview)
├── pages/
│   ├── Login.tsx, Register.tsx
│   ├── Dashboard.tsx, Agenda.tsx
│   ├── Patients.tsx, PatientDetail.tsx
│   ├── Consultation.tsx
│   ├── Documents.tsx
│   └── Settings.tsx
```

## Fase 2 (posterior): Integração Supabase

Após aprovar o frontend, conectaremos Supabase para:
- Auth real (login/cadastro)
- Criação das 5 tabelas com RLS
- Substituir mock data por queries reais
- Storage para avatares e PDFs

---

**Resumo**: Esta primeira fase entrega o app completo visualmente funcional com dados mock, permitindo testar todos os fluxos. A integração com Supabase vem na sequência.

Posso prosseguir com a implementação da Fase 1?

