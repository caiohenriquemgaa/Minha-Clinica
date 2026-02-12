-- Script de teste para verificar se a estrutura reminders está funcionando

-- 1. Primeiro, identifique um paciente real com telefone
SELECT id, name, phone FROM patients WHERE phone IS NOT NULL LIMIT 1;

-- 2. Identifique um procedimento real
SELECT id, name FROM procedures LIMIT 1;

-- 3. Com os UUIDs acima, crie uma sessão de teste com status 'agendado'
-- COPIE E COLE O COMANDO ABAIXO, substituindo os UUIDs reais:
-- INSERT INTO sessions (patient_id, procedure_id, scheduled_date, status)
-- VALUES ('abc123-uuid-aqui'::uuid, 'def456-uuid-aqui'::uuid, NOW() + INTERVAL '1 day', 'agendado');

-- 4. Após inserir, verifique se 2 reminders foram criadas automaticamente:
-- SELECT id, session_id, window_type, status, scheduled_at, message FROM reminders 
-- WHERE session_id = (SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1)
-- ORDER BY window_type DESC;
-- Deve retornar 2 linhas: uma com window_type='24h', uma com '2h'
