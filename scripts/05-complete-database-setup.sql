-- Script completo para configurar o banco de dados JM Estética e Saúde
-- Este script cria todas as tabelas necessárias e adiciona colunas ausentes

-- Primeiro, criar todas as tabelas que podem estar faltando
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    address TEXT,
    medical_history TEXT,
    allergies TEXT,
    medications TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(4,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration_minutes INTEGER,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.anamnesis_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    questions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.anamnesis_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES anamnesis_templates(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    procedure_id UUID REFERENCES procedures(id) ON DELETE SET NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    price DECIMAL(10,2),
    google_calendar_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agora adicionar colunas que podem estar faltando (usando DO blocks para verificar)
DO $$
BEGIN
    -- Adicionar is_active para patients se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'is_active') THEN
        ALTER TABLE patients ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Adicionar is_active para procedures se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'procedures' AND column_name = 'is_active') THEN
        ALTER TABLE procedures ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Adicionar is_active para anamnesis_templates se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis_templates' AND column_name = 'is_active') THEN
        ALTER TABLE anamnesis_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Adicionar is_completed para anamnesis_responses se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis_responses' AND column_name = 'is_completed') THEN
        ALTER TABLE anamnesis_responses ADD COLUMN is_completed BOOLEAN DEFAULT false;
    END IF;

    -- Adicionar google_calendar_event_id para sessions se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'google_calendar_event_id') THEN
        ALTER TABLE sessions ADD COLUMN google_calendar_event_id VARCHAR(255);
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category);
CREATE INDEX IF NOT EXISTS idx_procedures_active ON procedures(is_active);
CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_category ON anamnesis_templates(category);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_patient ON anamnesis_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_template ON anamnesis_responses(template_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Habilitar RLS (Row Level Security)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas (permitir tudo por enquanto - ajustar conforme necessário)
DO $$
BEGIN
    -- Políticas para patients
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'patients_policy') THEN
        CREATE POLICY patients_policy ON patients FOR ALL USING (true);
    END IF;

    -- Políticas para procedures
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedures' AND policyname = 'procedures_policy') THEN
        CREATE POLICY procedures_policy ON procedures FOR ALL USING (true);
    END IF;

    -- Políticas para anamnesis_templates
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'anamnesis_templates' AND policyname = 'anamnesis_templates_policy') THEN
        CREATE POLICY anamnesis_templates_policy ON anamnesis_templates FOR ALL USING (true);
    END IF;

    -- Políticas para anamnesis_responses
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'anamnesis_responses' AND policyname = 'anamnesis_responses_policy') THEN
        CREATE POLICY anamnesis_responses_policy ON anamnesis_responses FOR ALL USING (true);
    END IF;

    -- Políticas para sessions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'sessions_policy') THEN
        CREATE POLICY sessions_policy ON sessions FOR ALL USING (true);
    END IF;

    -- Políticas para users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_policy') THEN
        CREATE POLICY users_policy ON users FOR ALL USING (true);
    END IF;
END $$;

-- Inserir dados de exemplo para procedimentos
INSERT INTO procedures (name, description, category, duration_minutes, price) VALUES
('Limpeza de Pele Profunda', 'Limpeza facial completa com extração e hidratação', 'facial', 90, 120.00),
('Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 60, 200.00),
('Drenagem Linfática', 'Massagem para redução de inchaço e toxinas', 'corporal', 60, 80.00),
('Radiofrequência Facial', 'Tratamento para firmeza e rejuvenescimento', 'facial', 45, 150.00),
('Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 60, 100.00)
ON CONFLICT (name) DO NOTHING;

-- Inserir template básico de anamnese
INSERT INTO anamnesis_templates (title, description, category, questions) VALUES
('Anamnese Facial Básica', 'Questionário padrão para tratamentos faciais', 'facial',
'[
  {"id": 1, "type": "text", "question": "Qual é o seu tipo de pele?", "required": true},
  {"id": 2, "type": "multiple_choice", "question": "Você tem alguma alergia conhecida?", "options": ["Sim", "Não"], "required": true},
  {"id": 3, "type": "textarea", "question": "Descreva sua rotina de cuidados com a pele:", "required": false},
  {"id": 4, "type": "multiple_choice", "question": "Você está grávida ou amamentando?", "options": ["Sim", "Não"], "required": true},
  {"id": 5, "type": "text", "question": "Que medicamentos você está tomando atualmente?", "required": false}
]'::jsonb)
ON CONFLICT (title) DO NOTHING;

-- Inserir usuário master
INSERT INTO users (email, name, role, is_active) VALUES
('jmmestetica.saude@gmail.com', 'JM Estética Admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Mensagem de sucesso
SELECT 'Database setup completed successfully!' as message;
