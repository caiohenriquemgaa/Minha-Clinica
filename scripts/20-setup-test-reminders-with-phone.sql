-- 20-setup-test-reminders-with-phone.sql
-- Script que cria um paciente com telefone, um procedimento, e testa o sistema de reminders

-- Step 1: Verificar se há pacientes sem telefone e adicionar telefone de teste
DO $$
DECLARE
  test_patient_id uuid;
  test_procedure_id uuid;
  test_organization_id uuid;
  patient_count int;
BEGIN
  -- Buscar uma organização existente
  SELECT id INTO test_organization_id FROM organizations LIMIT 1;
  
  IF test_organization_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma organização encontrada. Configure primeiro!';
  END IF;
  
  -- Contar pacientes existentes
  SELECT COUNT(*) INTO patient_count FROM patients WHERE organization_id = test_organization_id;
  
  -- Se não há nenhum paciente, criar um
  IF patient_count = 0 THEN
    INSERT INTO patients (organization_id, name, phone, email, birth_date)
    VALUES (test_organization_id, 'Paciente Teste', '5511999999999', 'teste@email.com', NOW()::date - INTERVAL '30 years')
    RETURNING id INTO test_patient_id;
    RAISE NOTICE 'Paciente criado: %', test_patient_id;
  ELSE
    -- Se há pacientes, usar o primeiro e atualizar telefone se não tiver
    SELECT id INTO test_patient_id FROM patients WHERE organization_id = test_organization_id LIMIT 1;
    UPDATE patients SET phone = '5511999999999' WHERE id = test_patient_id AND (phone IS NULL OR phone = '');
    RAISE NOTICE 'Paciente existente encontrado: %', test_patient_id;
  END IF;
  
  -- Verificar/criar procedimento na organização
  SELECT id INTO test_procedure_id FROM procedures WHERE organization_id = test_organization_id LIMIT 1;
  
  IF test_procedure_id IS NULL THEN
    INSERT INTO procedures (organization_id, name, description, duration_minutes)
    VALUES (test_organization_id, 'Limpeza Facial', 'Procedimento de limpeza facial', 60)
    RETURNING id INTO test_procedure_id;
    RAISE NOTICE 'Procedimento criado: %', test_procedure_id;
  ELSE
    RAISE NOTICE 'Procedimento existente encontrado: %', test_procedure_id;
  END IF;
  
  -- Inserir sessão de teste com status 'agendado' (ativa o trigger)
  INSERT INTO sessions (organization_id, patient_id, procedure_id, scheduled_date, status)
  VALUES (test_organization_id, test_patient_id, test_procedure_id, NOW() + INTERVAL '1 day', 'agendado');
  
  RAISE NOTICE 'Sessão de teste criada com sucesso! Organization: %, Paciente: %, Procedure: %', 
    test_organization_id, test_patient_id, test_procedure_id;
  
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
