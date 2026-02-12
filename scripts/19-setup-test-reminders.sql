-- 19-setup-test-reminders.sql
-- Script completo para testar o sistema de reminders
-- Este script busca dados reais do banco e cria uma sessão de teste

-- Step 1: Pega um paciente com telefone
DO $$
DECLARE
  test_patient_id uuid;
  test_procedure_id uuid;
BEGIN
  -- Buscar paciente com telefone
  SELECT id INTO test_patient_id FROM patients WHERE phone IS NOT NULL LIMIT 1;
  
  IF test_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente com telefone encontrado. Configure primeiro!';
  END IF;
  
  -- Buscar procedimento
  SELECT id INTO test_procedure_id FROM procedures LIMIT 1;
  
  IF test_procedure_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum procedimento encontrado. Configure primeiro!';
  END IF;
  
  -- Inserir sessão de teste com status 'agendado' (garante que o trigger vai rodar)
  INSERT INTO sessions (patient_id, procedure_id, scheduled_date, status)
  VALUES (test_patient_id, test_procedure_id, NOW() + INTERVAL '1 day', 'agendado');
  
  RAISE NOTICE 'Sessão de teste criada! Paciente ID: %, Procedimento ID: %', test_patient_id, test_procedure_id;
  
END $$;

-- Step 2: Verificar se reminders foram criadas
SELECT 
  id,
  session_id,
  window_type,
  status,
  scheduled_at,
  message,
  patient_name,
  patient_phone
FROM reminders 
WHERE session_id = (SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1)
ORDER BY window_type DESC;
