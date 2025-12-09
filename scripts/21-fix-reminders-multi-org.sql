-- 21-fix-reminders-multi-org.sql
-- Corrige reminders para suportar multi-organization (SaaS)

-- Step 1: Adicionar organization_id a reminders se não existir
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Step 2: Adicionar constraint de organization (verificar se não existe)
DO $$
BEGIN
  ALTER TABLE reminders 
    ADD CONSTRAINT fk_reminders_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  -- Constraint já existe, ignorar
  NULL;
END $$;

-- Step 3: Atualizar trigger para incluir organization_id
CREATE OR REPLACE FUNCTION create_reminders_multi_window() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  phone text;
  patient_name text;
  patient_first_name text;
  proc_name text := 'consulta';
  time_str text;
  msg_24h text;
  msg_2h text;
  scheduled_24h_before timestamptz;
  scheduled_2h_before timestamptz;
BEGIN
  -- Retorna se DELETE
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  -- Apenas criar reminders para status 'agendado'
  IF NEW.status IS NULL OR NEW.status <> 'agendado' THEN
    RETURN NEW;
  END IF;

  -- Buscar dados do paciente
  SELECT p.phone, p.name INTO phone, patient_name FROM patients p WHERE p.id = NEW.patient_id LIMIT 1;
  IF phone IS NULL OR phone = '' THEN
    RETURN NEW;
  END IF;

  patient_first_name := split_part(patient_name, ' ', 1);

  -- Buscar nome do procedimento a partir de procedure_id
  IF NEW.procedure_id IS NOT NULL THEN
    SELECT pr.name INTO proc_name FROM procedures pr WHERE pr.id = NEW.procedure_id LIMIT 1;
  END IF;

  -- Formatar hora (em UTC ou timezone local, ajuste conforme necessário)
  time_str := to_char(NEW.scheduled_date AT TIME ZONE 'UTC', 'HH24:MI');

  -- Calcular scheduled_at para cada janela
  scheduled_24h_before := NEW.scheduled_date - INTERVAL '24 hours';
  scheduled_2h_before := NEW.scheduled_date - INTERVAL '2 hours';

  -- Mensagens para cada janela
  msg_24h := build_reminder_message(patient_first_name, proc_name, time_str, 24);
  msg_2h := build_reminder_message(patient_first_name, proc_name, time_str, 2);

  -- Inserir ou atualizar reminder para janela 24h
  INSERT INTO reminders (organization_id, session_id, patient_id, patient_phone, patient_name, message, scheduled_at, status, window_type, attempts)
  VALUES (NEW.organization_id, NEW.id, NEW.patient_id, phone, patient_name, msg_24h, scheduled_24h_before, 'pending', '24h', 0)
  ON CONFLICT (session_id, window_type) DO UPDATE
    SET patient_phone = EXCLUDED.patient_phone,
        patient_name = EXCLUDED.patient_name,
        message = EXCLUDED.message,
        scheduled_at = EXCLUDED.scheduled_at,
        attempts = 0,
        status = 'pending',
        updated_at = now()
    WHERE reminders.status IN ('pending', 'failed');

  -- Inserir ou atualizar reminder para janela 2h
  INSERT INTO reminders (organization_id, session_id, patient_id, patient_phone, patient_name, message, scheduled_at, status, window_type, attempts)
  VALUES (NEW.organization_id, NEW.id, NEW.patient_id, phone, patient_name, msg_2h, scheduled_2h_before, 'pending', '2h', 0)
  ON CONFLICT (session_id, window_type) DO UPDATE
    SET patient_phone = EXCLUDED.patient_phone,
        patient_name = EXCLUDED.patient_name,
        message = EXCLUDED.message,
        scheduled_at = EXCLUDED.scheduled_at,
        attempts = 0,
        status = 'pending',
        updated_at = now()
    WHERE reminders.status IN ('pending', 'failed');

  RETURN NEW;
END;
$$;

-- Recriar índice com organization_id
DROP INDEX IF EXISTS idx_reminders_status_scheduled_at;
CREATE INDEX idx_reminders_status_scheduled_at ON reminders(organization_id, status, scheduled_at, window_type);
