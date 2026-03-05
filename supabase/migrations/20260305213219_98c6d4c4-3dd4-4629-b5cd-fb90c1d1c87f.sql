
-- Enums
CREATE TYPE public.specialty AS ENUM ('endocrinologia', 'obstetricia', 'pediatria');
CREATE TYPE public.appointment_type AS ENUM ('particular', 'convenio');
CREATE TYPE public.appointment_status AS ENUM ('agendada', 'confirmada', 'realizada', 'cancelada', 'faltou');
CREATE TYPE public.document_type AS ENUM ('receita', 'relatorio', 'atestado', 'pedido_exame');

-- Doctors table (id = auth.users.id)
CREATE TABLE public.doctors (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty public.specialty NOT NULL DEFAULT 'endocrinologia',
  crm TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT,
  working_hours JSONB,
  accepted_insurances TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own profile" ON public.doctors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Doctors can update own profile" ON public.doctors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Doctors can insert own profile" ON public.doctors FOR INSERT WITH CHECK (auth.uid() = id);

-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  cpf TEXT,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL DEFAULT '',
  insurance TEXT,
  blood_type TEXT,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own patients" ON public.patients FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert own patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own patients" ON public.patients FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can delete own patients" ON public.patients FOR DELETE USING (auth.uid() = doctor_id);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  type public.appointment_type NOT NULL DEFAULT 'particular',
  status public.appointment_status NOT NULL DEFAULT 'agendada',
  insurance_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can delete own appointments" ON public.appointments FOR DELETE USING (auth.uid() = doctor_id);

-- Medical Records table
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own records" ON public.medical_records FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert own records" ON public.medical_records FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own records" ON public.medical_records FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can delete own records" ON public.medical_records FOR DELETE USING (auth.uid() = doctor_id);

-- Documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  type public.document_type NOT NULL DEFAULT 'receita',
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  file_url TEXT,
  sent_via TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own documents" ON public.documents FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = doctor_id);

-- Trigger: auto-create doctor profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.doctors (id, name, email, specialty, crm, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    COALESCE((NEW.raw_user_meta_data->>'specialty')::public.specialty, 'endocrinologia'),
    COALESCE(NEW.raw_user_meta_data->>'crm', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
