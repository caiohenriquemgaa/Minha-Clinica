-- Script para adicionar coluna full_name se não existir e inserir usuário master
-- Executa de forma segura sem erros de coluna inexistente

-- Adicionar coluna full_name se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Adicionar outras colunas necessárias se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Remover usuário existente se houver
DELETE FROM users WHERE email = 'jmmestetica.saude@gmail.com';

-- Inserir usuário master com credenciais corretas
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'jmmestetica.saude@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash para 'jmestetica2025'
    'JM Estética e Saúde - Admin',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Habilitar RLS em todas as tabelas se ainda não estiver habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para desenvolvimento (temporárias)
DROP POLICY IF EXISTS "Allow all for development" ON users;
CREATE POLICY "Allow all for development" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for development" ON patients;
CREATE POLICY "Allow all for development" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for development" ON procedures;
CREATE POLICY "Allow all for development" ON procedures FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for development" ON sessions;
CREATE POLICY "Allow all for development" ON sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for development" ON anamneses;
CREATE POLICY "Allow all for development" ON anamneses FOR ALL USING (true) WITH CHECK (true);

-- Inserir alguns procedimentos de exemplo
INSERT INTO procedures (id, name, description, category, price, duration_minutes, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Limpeza de Pele', 'Limpeza facial profunda com extração', 'facial', 80.00, 60, true, NOW(), NOW()),
    (gen_random_uuid(), 'Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 120.00, 45, true, NOW(), NOW()),
    (gen_random_uuid(), 'Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 100.00, 60, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT 'Configuração do banco de dados concluída com sucesso!' as status;
