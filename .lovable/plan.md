

# Diferenciação Particular vs Convênio na Agenda

## O que mudar

Adicionar indicador visual claro do tipo de consulta (particular/convênio) nos cards de agendamento em todas as 3 views (semana, dia, mês).

## Implementação

**Em cada card de consulta** nas 3 views:
- Adicionar um **Badge** compacto indicando "Particular" ou o nome do convênio (ex: "Unimed")
- **Particular**: Badge com fundo roxo/indigo suave para diferenciar visualmente
- **Convênio**: Badge com fundo azul suave mostrando o nome do convênio

**Detalhes por view:**
1. **Week view** (cards compactos): Adicionar badge pequeno abaixo do nome do paciente com "Part." ou abreviação do convênio
2. **Day view** (cards maiores): Badge já existe para status — adicionar segundo badge para tipo, ao lado
3. **Month view**: Usar dots coloridos diferenciados (azul = convênio, roxo = particular) em vez do atual ponto único

**Helper function**: Criar `getAppointmentInsurance(apt)` que busca o convênio do paciente associado para exibir o nome correto.

**Arquivo afetado**: `src/pages/Agenda.tsx` apenas.

