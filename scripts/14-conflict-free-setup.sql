-- Script final para configuração completa do banco JM Estética e Saúde
-- Este script evita conflitos e pode ser executado múltiplas vezes

-- 1. Adicionar colunas faltantes na tabela users
DO $$
BEGIN
    -- Adicionar coluna full_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
    END IF;
    
    -- Adicionar coluna password_hash se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
    
    -- Adicionar coluna role se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    
    -- Adicionar coluna is_active se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Remover usuário existente se houver
DELETE FROM users WHERE email = 'jmmestetica.saude@gmail.com';

-- 3. Inserir usuário master com todos os campos obrigatórios
INSERT INTO users (
    id,
    email,
    name,
    full_name,
    password_hash,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'jmmestetica.saude@gmail.com',
    'Admin JM',
    'JM Estética e Saúde - Administrador',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    true,
    now(),
    now()
);

-- 4. Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes se houver
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "patients_policy" ON patients;
DROP POLICY IF EXISTS "procedures_policy" ON procedures;
DROP POLICY IF EXISTS "sessions_policy" ON sessions;
DROP POLICY IF EXISTS "anamneses_policy" ON anamneses;

-- 6. Criar políticas permissivas para desenvolvimento
CREATE POLICY "users_policy" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "patients_policy" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "procedures_policy" ON procedures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sessions_policy" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anamneses_policy" ON anamneses FOR ALL USING (true) WITH CHECK (true);

-- 7. Inserir procedimentos de exemplo (apenas se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM procedures WHERE name = 'Limpeza de Pele Profunda') THEN
        INSERT INTO procedures (id, name, description, category, duration_minutes, price, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Limpeza de Pele Profunda', 'Limpeza facial completa com extração e hidratação', 'facial', 90, 120.00, true, now(), now()),
        (gen_random_uuid(), 'Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 60, 200.00, true, now(), now()),
        (gen_random_uuid(), 'Drenagem Linfática', 'Massagem para redução de inchaço e toxinas', 'corporal', 60, 80.00, true, now(), now()),
        (gen_random_uuid(), 'Radiofrequência Facial', 'Tratamento para firmeza e rejuvenescimento', 'facial', 45, 150.00, true, now(), now()),
        (gen_random_uuid(), 'Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 60, 100.00, true, now(), now());
    END IF;
END $$;

-- 8. Inserir template de anamnese básico (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM anamnesis_templates WHERE title = 'Anamnese Facial Básica') THEN
        INSERT INTO anamnesis_templates (id, title, description, category, questions, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Anamnese Facial Básica', 'Questionário padrão para tratamentos faciais', 'facial', 
        '[
            {"id": 1, "type": "text", "question": "Qual é o seu tipo de pele?", "required": true},
            {"id": 2, "type": "multiple_choice", "question": "Você tem alguma alergia conhecida?", "options": ["Sim", "Não"], "required": true},
            {"id": 3, "type": "textarea", "question": "Descreva sua rotina de cuidados com a pele:", "required": false},
            {"id": 4, "type": "multiple_choice", "question": "Você está grávida ou amamentando?", "options": ["Sim", "Não"], "required": true},
            {"id": 5, "type": "text", "question": "Que medicamentos você está tomando atualmente?", "required": false}
        ]'::jsonb, true, now(), now());
    END IF;
END $$;

-- Confirmar que o script foi executado com sucesso
SELECT 'Configuração do banco de dados concluída com sucesso!' as status;
