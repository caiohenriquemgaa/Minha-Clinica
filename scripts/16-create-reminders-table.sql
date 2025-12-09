-- 16-create-reminders-table.sql
-- Cria tabela de reminders e trigger para popular automaticamente a partir de sessions

-- Extensão para gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela reminders
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id uuid,
  patient_phone text,
  patient_name text,
  message text,
  scheduled_at timestamptz,
  status text DEFAULT 'pending', -- pending | sent | failed
  attempts integer DEFAULT 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Function to build a default message from session data
CREATE OR REPLACE FUNCTION build_reminder_message(session_row sessions) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  first_name text;
  time_str text;
  proc_name text := 'consulta';
BEGIN
  IF session_row.patients IS NOT NULL THEN
    first_name := split_part(session_row.patients->>'name', ' ', 1);
  ELSE
    first_name := 'Paciente';
  END IF;
  IF session_row.procedures IS NOT NULL THEN
    proc_name := session_row.procedures->>'name';
  END IF;
  time_str := to_char(session_row.scheduled_date AT TIME ZONE 'UTC', 'HH24:MI');
  RETURN format('Olá %s, lembramos que você tem %s agendada para %s. Qualquer dúvida, entre em contato.', first_name, proc_name, time_str);
END;
$$;

-- Function to insert reminder for a given session id (safe to call)
CREATE OR REPLACE FUNCTION create_reminder_for_session() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  s sessions%ROWTYPE;
  phone text;
  patient_name text;
  msg text;
BEGIN
  -- Prefer NEW if available, otherwise OLD
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  s := NEW;

  -- Only create reminder for agendado status
  IF s.status IS NULL OR s.status <> 'agendado' THEN
    RETURN NEW;
  END IF;

  -- Try to get patient phone and name from patients table
  SELECT phone, name INTO phone, patient_name FROM patients WHERE id = s.patient_id LIMIT 1;
  IF phone IS NULL OR phone = '' THEN
    -- nothing to do
    RETURN NEW;
  END IF;

  -- Build message using helper
  msg := build_reminder_message(s);

  -- Upsert reminder for this session (avoid duplicates)
  INSERT INTO reminders (session_id, patient_id, patient_phone, patient_name, message, scheduled_at, status)
  VALUES (s.id, s.patient_id, phone, patient_name, msg, s.scheduled_date, 'pending')
  ON CONFLICT (session_id) DO UPDATE
    SET patient_phone = EXCLUDED.patient_phone,
        patient_name = EXCLUDED.patient_name,
        message = EXCLUDED.message,
        scheduled_at = EXCLUDED.scheduled_at,
        updated_at = now();

  RETURN NEW;
END;
$$;

-- Trigger: after insert or update on sessions
DROP TRIGGER IF EXISTS trg_create_reminder_on_sessions ON sessions;
CREATE TRIGGER trg_create_reminder_on_sessions
AFTER INSERT OR UPDATE OF status, scheduled_date, patient_id ON sessions
FOR EACH ROW EXECUTE FUNCTION create_reminder_for_session();

-- Index to speed queries
CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled_at ON reminders(status, scheduled_at);
