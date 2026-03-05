export type Specialty = 'endocrinologia' | 'obstetricia' | 'pediatria';

export type AppointmentType = 'particular' | 'convenio';
export type AppointmentStatus = 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'faltou';
export type DocumentType = 'receita' | 'relatorio' | 'atestado' | 'pedido_exame';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: Specialty;
  crm: string;
  phone: string;
  whatsapp_number?: string;
  working_hours?: Record<string, { inicio: string; fim: string }>;
  accepted_insurances: string[];
  avatar_url?: string;
  created_at: string;
}

export interface Patient {
  id: string;
  doctor_id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  birth_date: string;
  gender: string;
  insurance?: string;
  blood_type?: string;
  allergies?: string;
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  insurance_code?: string;
  notes?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  appointment_id?: string;
  patient_id: string;
  doctor_id: string;
  template_type: string;
  content: Record<string, any>;
  created_at: string;
}

export interface Document {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  type: DocumentType;
  title: string;
  content: Record<string, any>;
  file_url?: string;
  sent_via?: 'whatsapp' | 'email';
  sent_at?: string;
  created_at: string;
}
