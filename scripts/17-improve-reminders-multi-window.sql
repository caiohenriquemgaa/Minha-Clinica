-- 17-improve-reminders-multi-window.sql
-- Melhora na tabela reminders e função de mensagem para suportar múltiplas janelas

-- Adiciona coluna 'window_type' para identificar qual janela o reminder pertence (24h ou 2h)
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS window_type text DEFAULT '24h'; -- '24h' | '2h'

-- Melhora função build_reminder_message para incluir detalhes do profissional e local
CREATE OR REPLACE FUNCTION build_reminder_message(
  patient_first_name text,
  procedure_name text,
  scheduled_time text,
  professional_name text DEFAULT NULL,
  room text DEFAULT NULL,
  window_hours integer DEFAULT 24
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  msg text;
  details text := '';
BEGIN
  -- Construir detalhes adicionais
  IF professional_name IS NOT NULL AND professional_name <> '' THEN
    details := details || format(' com %s', professional_name);
  END IF;
  
  IF room IS NOT NULL AND room <> '' THEN
    details := details || format(' (sala %s)', room);
  END IF;

  -- Mensagem diferenciada por janela
  IF window_hours = 2 THEN
    msg := format('🚨 Atenção %s! Sua %s%s começa em breve, às %s. Chegue com antecedência!', 
                  patient_first_name, procedure_name, details, scheduled_time);
  ELSE
    -- Default: 24h antes
    msg := format('📅 Olá %s! Lembramos que você tem %s%s agendada para amanhã às %s. Qualquer dúvida, entre em contato.', 
                  patient_first_name, procedure_name, details, scheduled_time);
  END IF;

  RETURN msg;
END;
$$;

-- Função para criar múltiplos reminders por sessão (24h e 2h antes)
CREATE OR REPLACE FUNCTION create_reminders_multi_window() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  s sessions%ROWTYPE;
  phone text;
  patient_name text;
  patient_first_name text;
  proc_name text := 'consulta';
  prof_name text;
  room_val text;
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
  
  s := NEW;

  -- Apenas criar reminders para status 'agendado'
  IF s.status IS NULL OR s.status <> 'agendado' THEN
    RETURN NEW;
  END IF;

  -- Buscar dados do paciente
  SELECT phone, name INTO phone, patient_name FROM patients WHERE id = s.patient_id LIMIT 1;
  IF phone IS NULL OR phone = '' THEN
    RETURN NEW;
  END IF;

  patient_first_name := split_part(patient_name, ' ', 1);

  -- Buscar nome do procedimento
  IF s.procedures IS NOT NULL THEN
    proc_name := s.procedures->>'name';
  END IF;

  -- Nome do profissional (use o armazenado na sessão ou procedimento)
  prof_name := s.professional_name;

  -- Room/sala
  room_val := s.room;

  -- Formatar hora
  time_str := to_char(s.scheduled_date AT TIME ZONE 'UTC', 'HH24:MI');

  -- Calcular scheduled_at para cada janela
  scheduled_24h_before := s.scheduled_date - INTERVAL '24 hours';
  scheduled_2h_before := s.scheduled_date - INTERVAL '2 hours';

  -- Mensagens para cada janela
  msg_24h := build_reminder_message(patient_first_name, proc_name, time_str, prof_name, room_val, 24);
  msg_2h := build_reminder_message(patient_first_name, proc_name, time_str, prof_name, room_val, 2);

  -- Inserir ou atualizar reminder para janela 24h
  INSERT INTO reminders (session_id, patient_id, patient_phone, patient_name, message, scheduled_at, status, window_type, attempts)
  VALUES (s.id, s.patient_id, phone, patient_name, msg_24h, scheduled_24h_before, 'pending', '24h', 0)
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
  VALUES (s.id, s.patient_id, phone, patient_name, msg_2h, scheduled_2h_before, 'pending', '2h', 0)
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

-- Recriar trigger para usar nova função
DROP TRIGGER IF EXISTS trg_create_reminder_on_sessions ON sessions;
CREATE TRIGGER trg_create_reminder_on_sessions
AFTER INSERT OR UPDATE OF status, scheduled_date, patient_id ON sessions
FOR EACH ROW EXECUTE FUNCTION create_reminders_multi_window();

-- Adicionar constraint única por (session_id, window_type) para evitar duplicatas
ALTER TABLE reminders ADD CONSTRAINT unique_session_window UNIQUE (session_id, window_type);

-- Recriar índice com window_type
DROP INDEX IF EXISTS idx_reminders_status_scheduled_at;
CREATE INDEX idx_reminders_status_scheduled_at ON reminders(status, scheduled_at, window_type);
