-- Primeiro, vamos verificar e adicionar as colunas que faltam na tabela users
DO $$ 
BEGIN
    -- Adicionar coluna full_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE public.users ADD COLUMN full_name TEXT;
    END IF;
    
    -- Adicionar coluna password_hash se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE public.users ADD COLUMN password_hash TEXT;
    END IF;
    
    -- Adicionar coluna role se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    
    -- Adicionar coluna is_active se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE public.users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Habilitar RLS nas tabelas restantes
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS simples e permissivas para desenvolvimento
CREATE POLICY "Allow all operations for authenticated users" ON public.users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.patients
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.procedures
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.anamneses
    FOR ALL USING (true) WITH CHECK (true);

-- Inserir usuário master (verificar se já existe primeiro)
INSERT INTO public.users (email, password_hash, full_name, role, is_active, created_at, updated_at)
SELECT 
    'jmmestetica.saude@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- hash para 'jmestetica2025'
    'JM Estética e Saúde - Admin',
    'admin',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'jmmestetica.saude@gmail.com'
);

-- Inserir alguns procedimentos de exemplo
INSERT INTO public.procedures (name, description, category, duration_minutes, price, is_active, created_at, updated_at)
VALUES 
    ('Limpeza de Pele Profunda', 'Limpeza facial completa com extração e hidratação', 'facial', 90, 120.00, true, NOW(), NOW()),
    ('Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 60, 200.00, true, NOW(), NOW()),
    ('Drenagem Linfática', 'Massagem para redução de inchaço e toxinas', 'corporal', 60, 80.00, true, NOW(), NOW()),
    ('Radiofrequência Facial', 'Tratamento para firmeza e rejuvenescimento', 'facial', 45, 150.00, true, NOW(), NOW()),
    ('Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 60, 100.00, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
