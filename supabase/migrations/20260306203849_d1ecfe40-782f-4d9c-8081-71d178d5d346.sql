
CREATE OR REPLACE FUNCTION public.notify_n8n_appointment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _patient_name text;
  _patient_phone text;
  _doctor_name text;
  _evolution_api_url text;
  _evolution_api_key text;
  _evolution_instance_id text;
BEGIN
  SELECT name, phone INTO _patient_name, _patient_phone
  FROM public.patients WHERE id = NEW.patient_id;

  SELECT name INTO _doctor_name
  FROM public.doctors WHERE id = NEW.doctor_id;

  SELECT evolution_api_url, evolution_api_key, evolution_instance_id
  INTO _evolution_api_url, _evolution_api_key, _evolution_instance_id
  FROM public.integrations_config WHERE doctor_id = NEW.doctor_id;

  PERFORM net.http_post(
    url := 'https://n8n.sapientiabr.cloud/webhook/medflow-webhook-agendamentos',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', TG_OP,
      'record', jsonb_build_object(
        'id', NEW.id,
        'date', NEW.date,
        'time', NEW.time,
        'status', NEW.status,
        'type', NEW.type,
        'notes', NEW.notes,
        'doctor_id', NEW.doctor_id,
        'doctor_name', _doctor_name,
        'patient_id', NEW.patient_id,
        'patient_name', _patient_name,
        'patient_phone', _patient_phone,
        'appointment_date', to_char(NEW.date, 'DD/MM/YYYY'),
        'appointment_time', NEW.time::text,
        'evolution_api_url', _evolution_api_url,
        'evolution_api_key', _evolution_api_key,
        'evolution_instance_id', _evolution_instance_id
      ),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'date', OLD.date,
        'time', OLD.time,
        'status', OLD.status
      ) ELSE NULL END
    )
  );

  RETURN NEW;
END;
$$;

-- Drop old trigger
DROP TRIGGER IF EXISTS on_new_appointment ON public.appointments;

-- Recreate trigger for INSERT and UPDATE
CREATE TRIGGER on_appointment_change
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_n8n_appointment_change();
