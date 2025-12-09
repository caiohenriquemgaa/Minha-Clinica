-- 20-setup-test-reminders-with-phone.sql
-- Script que cria um paciente com telefone, um procedimento, e testa o sistema de reminders

-- Step 1: Verificar se há pacientes sem telefone e adicionar telefone de teste
DO $$
DECLARE
  test_patient_id uuid;
  test_procedure_id uuid;
  patient_count int;
BEGIN
  -- Contar pacientes existentes
  SELECT COUNT(*) INTO patient_count FROM patients;
  
  -- Se não há nenhum paciente, criar um
  IF patient_count = 0 THEN
    INSERT INTO patients (name, phone, email, date_of_birth)
    VALUES ('Paciente Teste', '5511999999999', 'teste@email.com', NOW() - INTERVAL '30 years')
    RETURNING id INTO test_patient_id;
    RAISE NOTICE 'Paciente criado: %', test_patient_id;
  ELSE
    -- Se há pacientes, usar o primeiro e atualizar telefone se não tiver
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    UPDATE patients SET phone = '5511999999999' WHERE id = test_patient_id AND (phone IS NULL OR phone = '');
    RAISE NOTICE 'Paciente existente encontrado: %', test_patient_id;
  END IF;
  
  -- Verificar/criar procedimento
  SELECT id INTO test_procedure_id FROM procedures LIMIT 1;
  
  IF test_procedure_id IS NULL THEN
    INSERT INTO procedures (name, description, duration_minutes)
    VALUES ('Limpeza Facial', 'Procedimento de limpeza facial', 60)
    RETURNING id INTO test_procedure_id;
    RAISE NOTICE 'Procedimento criado: %', test_procedure_id;
  ELSE
    RAISE NOTICE 'Procedimento existente encontrado: %', test_procedure_id;
  END IF;
  
  -- Inserir sessão de teste com status 'agendado' (ativa o trigger)
  INSERT INTO sessions (patient_id, procedure_id, scheduled_date, status)
  VALUES (test_patient_id, test_procedure_id, NOW() + INTERVAL '1 day', 'agendado');
  
  RAISE NOTICE 'Sessão de teste criada com sucesso!';
  
END $$;

-- Step 2: Mostrar os reminders criados
SELECT 
  id,
  session_id,
  window_type,
  status,
  scheduled_at,
  patient_name,
  patient_phone,
  message
FROM reminders 
WHERE session_id = (SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1)
ORDER BY window_type DESC;
