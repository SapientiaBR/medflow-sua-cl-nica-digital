
ALTER TABLE public.doctors ADD COLUMN avg_consultation_price NUMERIC DEFAULT 350;

CREATE TABLE public.integrations_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  evolution_api_url TEXT,
  evolution_api_key TEXT,
  evolution_instance_id TEXT,
  ai_active BOOLEAN DEFAULT false,
  ai_tone TEXT DEFAULT 'profissional e acolhedor',
  ai_instructions TEXT DEFAULT 'Você é a Secretária Digital do consultório. Seu objetivo é ajudar pacientes com agendamentos, dúvidas sobre endereços e convênios.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id)
);

ALTER TABLE public.integrations_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own config" ON public.integrations_config FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own config" ON public.integrations_config FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert own config" ON public.integrations_config FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integrations_config_updated_at
    BEFORE UPDATE ON public.integrations_config
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
