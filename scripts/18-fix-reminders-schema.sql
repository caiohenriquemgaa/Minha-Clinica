-- 18-fix-reminders-schema.sql
-- Corrige a tabela reminders e triggers para funcionar com a estrutura real de sessions

-- Step 1: Remover trigger antigo se existir (para evitar conflitos)
DROP TRIGGER IF EXISTS trg_create_reminder_on_sessions ON sessions;

-- Step 2: Remover função antiga se existir
DROP FUNCTION IF EXISTS create_reminder_for_session();
DROP FUNCTION IF EXISTS create_reminders_multi_window();
DROP FUNCTION IF EXISTS build_reminder_message(text, text, text, text, text, integer);
DROP FUNCTION IF EXISTS build_reminder_message(sessions);

-- Step 3: Remover constraint antiga se existir (será recriada com session_id + window_type)
ALTER TABLE reminders DROP CONSTRAINT IF EXISTS unique_session_window;
ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_session_id_key;

-- Step 4: Remover coluna window_type se existir (será recriada)
ALTER TABLE reminders DROP COLUMN IF EXISTS window_type;

-- Step 5: Garantir que reminders tem as colunas corretas
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS window_type text DEFAULT '24h';
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS processing boolean DEFAULT false;

-- Step 6: Criar constraint única para (session_id, window_type)
ALTER TABLE reminders ADD CONSTRAINT unique_session_window UNIQUE (session_id, window_type);

-- Step 7: Nova função de build de mensagem simples
CREATE OR REPLACE FUNCTION build_reminder_message(
  patient_first_name text,
  procedure_name text,
  scheduled_time text,
  window_hours integer DEFAULT 24
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  msg text;
BEGIN
  -- Mensagem diferenciada por janela
  IF window_hours = 2 THEN
    msg := format('🚨 Atenção %s! Sua %s começa em breve, às %s. Chegue com antecedência!', 
                  patient_first_name, procedure_name, scheduled_time);
  ELSE
    -- Default: 24h antes
    msg := format('📅 Olá %s! Lembramos que você tem %s agendada para amanhã às %s. Qualquer dúvida, entre em contato.', 
                  patient_first_name, procedure_name, scheduled_time);
  END IF;

  RETURN msg;
END;
$$;

-- Step 8: Nova função de trigger para criar múltiplos reminders
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
  INSERT INTO reminders (session_id, patient_id, patient_phone, patient_name, message, scheduled_at, status, window_type, attempts)
  VALUES (NEW.id, NEW.patient_id, phone, patient_name, msg_24h, scheduled_24h_before, 'pending', '24h', 0)
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
  INSERT INTO reminders (session_id, patient_id, patient_phone, patient_name, message, scheduled_at, status, window_type, attempts)
  VALUES (NEW.id, NEW.patient_id, phone, patient_name, msg_2h, scheduled_2h_before, 'pending', '2h', 0)
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

-- Step 9: Recriar trigger
CREATE TRIGGER trg_create_reminder_on_sessions
AFTER INSERT OR UPDATE OF status, scheduled_date, patient_id ON sessions
FOR EACH ROW EXECUTE FUNCTION create_reminders_multi_window();

-- Step 10: Recriar índice
DROP INDEX IF EXISTS idx_reminders_status_scheduled_at;
CREATE INDEX idx_reminders_status_scheduled_at ON reminders(status, scheduled_at, window_type);

-- Step 11: Dados do teste - encontre um paciente real
-- SELECT id, name, phone FROM patients LIMIT 1;
-- SELECT id FROM procedures LIMIT 1;
-- Depois rode manualmente:
-- INSERT INTO sessions (patient_id, procedure_id, scheduled_date, status)
-- VALUES (UUID_AQUI, PROCEDURE_UUID_AQUI, NOW() + INTERVAL '1 day', 'agendado');
