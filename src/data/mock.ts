import { Doctor, Patient, Appointment, MedicalRecord, Document } from '@/types';

export const INSURANCE_OPTIONS = [
  'Sulamérica',
  'Unimed',
  'Care Plus',
  'Amil',
  'Alice',
  'Bradesco',
] as const;
import { format, subDays, addDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

export const mockDoctor: Doctor = {
  id: 'doc-001',
  name: 'Maria Santos',
  email: 'maria@medflow.com',
  specialty: 'endocrinologia',
  crm: 'CRM/SP 123456',
  phone: '(11) 99999-0000',
  whatsapp_number: '5511999990000',
  working_hours: {
    seg: { inicio: '08:00', fim: '18:00' },
    ter: { inicio: '08:00', fim: '18:00' },
    qua: { inicio: '08:00', fim: '18:00' },
    qui: { inicio: '08:00', fim: '18:00' },
    sex: { inicio: '08:00', fim: '16:00' },
  },
  accepted_insurances: ['Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil'],
  created_at: '2024-01-01T00:00:00Z',
};

export const mockPatients: Patient[] = [
  { id: 'pat-001', doctor_id: 'doc-001', name: 'João Silva', phone: '(11) 98888-1111', email: 'joao@email.com', cpf: '123.456.789-00', birth_date: '1985-03-15', gender: 'masculino', insurance: 'Unimed', blood_type: 'O+', allergies: 'Penicilina', notes: 'Diabético tipo 2', created_at: '2024-01-10T00:00:00Z' },
  { id: 'pat-002', doctor_id: 'doc-001', name: 'Ana Oliveira', phone: '(11) 98888-2222', email: 'ana@email.com', birth_date: '1990-07-22', gender: 'feminino', insurance: 'Bradesco Saúde', blood_type: 'A+', created_at: '2024-01-15T00:00:00Z' },
  { id: 'pat-003', doctor_id: 'doc-001', name: 'Carlos Mendes', phone: '(11) 98888-3333', birth_date: '1978-11-05', gender: 'masculino', insurance: 'Particular', blood_type: 'B-', allergies: 'Dipirona, AAS', created_at: '2024-02-01T00:00:00Z' },
  { id: 'pat-004', doctor_id: 'doc-001', name: 'Beatriz Costa', phone: '(11) 98888-4444', email: 'bia@email.com', birth_date: '1995-01-30', gender: 'feminino', insurance: 'SulAmérica', created_at: '2024-02-10T00:00:00Z' },
  { id: 'pat-005', doctor_id: 'doc-001', name: 'Roberto Almeida', phone: '(11) 98888-5555', birth_date: '1960-06-18', gender: 'masculino', insurance: 'Amil', blood_type: 'AB+', allergies: 'Sulfa', notes: 'Hipotireoidismo', created_at: '2024-02-20T00:00:00Z' },
  { id: 'pat-006', doctor_id: 'doc-001', name: 'Fernanda Lima', phone: '(11) 98888-6666', email: 'fer@email.com', birth_date: '1988-09-12', gender: 'feminino', insurance: 'Unimed', created_at: '2024-03-01T00:00:00Z' },
  { id: 'pat-007', doctor_id: 'doc-001', name: 'Pedro Souza', phone: '(11) 98888-7777', birth_date: '1972-04-25', gender: 'masculino', blood_type: 'O-', notes: 'Obesidade grau II', created_at: '2024-03-10T00:00:00Z' },
  { id: 'pat-008', doctor_id: 'doc-001', name: 'Mariana Ferreira', phone: '(11) 98888-8888', email: 'mari@email.com', birth_date: '1992-12-08', gender: 'feminino', insurance: 'Bradesco Saúde', allergies: 'Ibuprofeno', created_at: '2024-03-15T00:00:00Z' },
  { id: 'pat-009', doctor_id: 'doc-001', name: 'Lucas Barbosa', phone: '(11) 98888-9999', birth_date: '2000-02-14', gender: 'masculino', insurance: 'Particular', created_at: '2024-04-01T00:00:00Z' },
  { id: 'pat-010', doctor_id: 'doc-001', name: 'Camila Rodrigues', phone: '(11) 97777-0000', email: 'camila@email.com', birth_date: '1983-08-20', gender: 'feminino', insurance: 'SulAmérica', blood_type: 'A-', created_at: '2024-04-10T00:00:00Z' },
];

export const mockAppointments: Appointment[] = [
  { id: 'apt-001', doctor_id: 'doc-001', patient_id: 'pat-001', date: today, time: '08:00', duration_minutes: 30, type: 'convenio', status: 'confirmada', insurance_code: 'UNI-001', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-002', doctor_id: 'doc-001', patient_id: 'pat-002', date: today, time: '08:30', duration_minutes: 30, type: 'convenio', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-003', doctor_id: 'doc-001', patient_id: 'pat-003', date: today, time: '09:00', duration_minutes: 45, type: 'particular', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-004', doctor_id: 'doc-001', patient_id: 'pat-004', date: today, time: '10:00', duration_minutes: 30, type: 'convenio', status: 'confirmada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-005', doctor_id: 'doc-001', patient_id: 'pat-005', date: today, time: '10:30', duration_minutes: 30, type: 'convenio', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-006', doctor_id: 'doc-001', patient_id: 'pat-006', date: today, time: '11:00', duration_minutes: 30, type: 'convenio', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-007', doctor_id: 'doc-001', patient_id: 'pat-007', date: today, time: '14:00', duration_minutes: 45, type: 'particular', status: 'confirmada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-008', doctor_id: 'doc-001', patient_id: 'pat-008', date: today, time: '15:00', duration_minutes: 30, type: 'convenio', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-009', doctor_id: 'doc-001', patient_id: 'pat-001', date: yesterday, time: '08:00', duration_minutes: 30, type: 'convenio', status: 'realizada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-010', doctor_id: 'doc-001', patient_id: 'pat-002', date: yesterday, time: '09:00', duration_minutes: 30, type: 'convenio', status: 'realizada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-011', doctor_id: 'doc-001', patient_id: 'pat-003', date: yesterday, time: '10:00', duration_minutes: 45, type: 'particular', status: 'faltou', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-012', doctor_id: 'doc-001', patient_id: 'pat-009', date: yesterday, time: '11:00', duration_minutes: 30, type: 'particular', status: 'realizada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-013', doctor_id: 'doc-001', patient_id: 'pat-005', date: tomorrow, time: '08:00', duration_minutes: 30, type: 'convenio', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-014', doctor_id: 'doc-001', patient_id: 'pat-006', date: tomorrow, time: '09:00', duration_minutes: 30, type: 'convenio', status: 'confirmada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-015', doctor_id: 'doc-001', patient_id: 'pat-010', date: tomorrow, time: '10:00', duration_minutes: 30, type: 'convenio', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-016', doctor_id: 'doc-001', patient_id: 'pat-004', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), time: '08:00', duration_minutes: 30, type: 'convenio', status: 'realizada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-017', doctor_id: 'doc-001', patient_id: 'pat-007', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), time: '09:00', duration_minutes: 45, type: 'particular', status: 'realizada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-018', doctor_id: 'doc-001', patient_id: 'pat-008', date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), time: '14:00', duration_minutes: 30, type: 'convenio', status: 'cancelada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-019', doctor_id: 'doc-001', patient_id: 'pat-001', date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), time: '08:00', duration_minutes: 30, type: 'convenio', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
  { id: 'apt-020', doctor_id: 'doc-001', patient_id: 'pat-010', date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), time: '10:00', duration_minutes: 30, type: 'particular', status: 'agendada', created_at: '2024-06-01T00:00:00Z' },
];

export const mockDocuments: Document[] = [
  { id: 'doc-001', patient_id: 'pat-001', doctor_id: 'doc-001', appointment_id: 'apt-009', type: 'receita', title: 'Receita - Metformina 850mg', content: { medicamentos: [{ nome: 'Metformina 850mg', posologia: '1 comprimido 2x ao dia', duracao: '30 dias' }] }, sent_via: 'whatsapp', sent_at: yesterday + 'T10:00:00Z', created_at: yesterday + 'T10:00:00Z' },
  { id: 'doc-002', patient_id: 'pat-002', doctor_id: 'doc-001', appointment_id: 'apt-010', type: 'pedido_exame', title: 'Pedido de Exames - Perfil Tireoidiano', content: { exames: ['TSH', 'T4 Livre', 'Anti-TPO'] }, created_at: yesterday + 'T11:00:00Z' },
  { id: 'doc-003', patient_id: 'pat-003', doctor_id: 'doc-001', type: 'atestado', title: 'Atestado Médico - 1 dia', content: { dias: 1, motivo: 'Consulta médica', cid: 'Z00.0' }, created_at: format(subDays(new Date(), 5), 'yyyy-MM-dd') + 'T09:00:00Z' },
];

export const mockMedicalRecords: MedicalRecord[] = [
  {
    id: 'rec-001', appointment_id: 'apt-009', patient_id: 'pat-001', doctor_id: 'doc-001',
    template_type: 'anamnese_endocrina',
    content: {
      queixa: 'Controle glicêmico inadequado',
      hma: 'Paciente refere glicemias de jejum acima de 180mg/dL na última semana',
      medicamentos: 'Metformina 500mg 2x/dia',
      peso: 92, altura: 1.75, imc: 30.04, pa: '130/85', fc: 78,
      conduta: 'Aumentar Metformina para 850mg 2x/dia. Retorno em 30 dias com exames.',
    },
    created_at: yesterday + 'T09:00:00Z',
  },
  {
    id: 'rec-002', appointment_id: 'apt-010', patient_id: 'pat-002', doctor_id: 'doc-001',
    template_type: 'anamnese_endocrina',
    content: {
      queixa: 'Fadiga e ganho de peso',
      hma: 'Sintomas há 3 meses, sem uso de medicação tireoidiana',
      peso: 68, altura: 1.62, imc: 25.91, pa: '120/80', fc: 65,
      conduta: 'Solicitar perfil tireoidiano. Retorno com exames.',
    },
    created_at: yesterday + 'T10:00:00Z',
  },
];
