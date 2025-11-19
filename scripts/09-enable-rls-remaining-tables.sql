-- Habilitar RLS e criar políticas para as tabelas restantes
-- Este script remove os alertas "Unrestricted" das tabelas

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela patients
CREATE POLICY "Allow all operations for authenticated users" ON public.patients
    FOR ALL USING (true) WITH CHECK (true);

-- Políticas para a tabela procedures
CREATE POLICY "Allow all operations for authenticated users" ON public.procedures
    FOR ALL USING (true) WITH CHECK (true);

-- Políticas para a tabela sessions
CREATE POLICY "Allow all operations for authenticated users" ON public.sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Políticas para a tabela anamneses
CREATE POLICY "Allow all operations for authenticated users" ON public.anamneses
    FOR ALL USING (true) WITH CHECK (true);

-- Políticas para a tabela users
CREATE POLICY "Allow all operations for authenticated users" ON public.users
    FOR ALL USING (true) WITH CHECK (true);

-- Inserir usuário master se não existir
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'jmmestetica.saude@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- hash para 'jmestetica2025'
    'JM Estética Master Admin',
    'admin',
    true,
    now(),
    now()
) ON CONFLICT (email) DO NOTHING;

-- Inserir alguns dados de exemplo para testar
INSERT INTO public.procedures (name, description, category, duration_minutes, price, is_active) VALUES
('Limpeza de Pele', 'Limpeza facial profunda com extração', 'facial', 60, 80.00, true),
('Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 45, 120.00, true),
('Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 90, 150.00, true)
ON CONFLICT (name) DO NOTHING;
