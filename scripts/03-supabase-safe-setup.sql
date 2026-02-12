-- Script seguro para configuração do Supabase - JM Estética e Saúde
-- Este script pode ser executado múltiplas vezes sem erros

-- Remover tabelas existentes se necessário (descomente se quiser recriar tudo)
-- DROP TABLE IF EXISTS public.sessions CASCADE;
-- DROP TABLE IF EXISTS public.anamnesis_responses CASCADE;
-- DROP TABLE IF EXISTS public.anamnesis_templates CASCADE;
-- DROP TABLE IF EXISTS public.procedures CASCADE;
-- DROP TABLE IF EXISTS public.patients CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários (se não existir)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pacientes (se não existir)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  birth_date DATE,
  gender VARCHAR(20) CHECK (gender IN ('masculino', 'feminino', 'outro')),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  bmi DECIMAL(4,2) GENERATED ALWAYS AS (
    CASE 
      WHEN height > 0 THEN weight / ((height/100) * (height/100))
      ELSE NULL
    END
  ) STORED,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de procedimentos (se não existir)
CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL CHECK (category IN ('facial', 'corporal', 'capilar', 'outros')),
  duration_minutes INTEGER DEFAULT 60,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de templates de anamnese (se não existir)
CREATE TABLE IF NOT EXISTS public.anamnesis_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas de anamnese (se não existir)
CREATE TABLE IF NOT EXISTS public.anamnesis_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.anamnesis_templates(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'reviewed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões/agendamentos (se não existir)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  price DECIMAL(10,2),
  google_calendar_event_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_active ON public.patients(is_active);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON public.procedures(category);
CREATE INDEX IF NOT EXISTS idx_procedures_active ON public.procedures(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON public.sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_procedure ON public.sessions(procedure_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_patient ON public.anamnesis_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_template ON public.anamnesis_responses(template_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (criar apenas se não existirem)
DO $$
BEGIN
  -- Políticas para usuários
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view all users') THEN
    CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
  END IF;

  -- Políticas para pacientes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Users can manage all patients') THEN
    CREATE POLICY "Users can manage all patients" ON public.patients FOR ALL USING (true);
  END IF;

  -- Políticas para procedimentos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedures' AND policyname = 'Users can manage all procedures') THEN
    CREATE POLICY "Users can manage all procedures" ON public.procedures FOR ALL USING (true);
  END IF;

  -- Políticas para templates de anamnese
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'anamnesis_templates' AND policyname = 'Users can manage all templates') THEN
    CREATE POLICY "Users can manage all templates" ON public.anamnesis_templates FOR ALL USING (true);
  END IF;

  -- Políticas para respostas de anamnese
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'anamnesis_responses' AND policyname = 'Users can manage all responses') THEN
    CREATE POLICY "Users can manage all responses" ON public.anamnesis_responses FOR ALL USING (true);
  END IF;

  -- Políticas para sessões
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Users can manage all sessions') THEN
    CREATE POLICY "Users can manage all sessions" ON public.sessions FOR ALL USING (true);
  END IF;
END
$$;

-- Inserir usuário master (apenas se não existir)
INSERT INTO public.users (email, password_hash, name, role)
SELECT 'jmmestetica.saude@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'JM Estética Admin', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'jmmestetica.saude@gmail.com'
);

-- Inserir dados de exemplo para procedimentos (apenas se a tabela estiver vazia)
INSERT INTO public.procedures (name, description, category, duration_minutes, price)
SELECT * FROM (VALUES
  ('Limpeza de Pele Profunda', 'Limpeza facial completa com extração e hidratação', 'facial', 90, 120.00),
  ('Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 60, 200.00),
  ('Drenagem Linfática', 'Massagem para redução de inchaço e toxinas', 'corporal', 60, 80.00),
  ('Radiofrequência Facial', 'Tratamento para firmeza e rejuvenescimento', 'facial', 45, 150.00),
  ('Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 60, 100.00)
) AS v(name, description, category, duration_minutes, price)
WHERE NOT EXISTS (SELECT 1 FROM public.procedures LIMIT 1);

-- Inserir template básico de anamnese (apenas se não existir)
INSERT INTO public.anamnesis_templates (title, description, category, questions)
SELECT 'Anamnese Facial Básica', 'Questionário padrão para tratamentos faciais', 'facial',
'[
  {"id": 1, "type": "text", "question": "Qual é o seu tipo de pele?", "required": true},
  {"id": 2, "type": "multiple_choice", "question": "Você tem alguma alergia conhecida?", "options": ["Sim", "Não"], "required": true},
  {"id": 3, "type": "textarea", "question": "Descreva sua rotina de cuidados com a pele:", "required": false},
  {"id": 4, "type": "multiple_choice", "question": "Você está grávida ou amamentando?", "options": ["Sim", "Não"], "required": true},
  {"id": 5, "type": "text", "question": "Que medicamentos você está tomando atualmente?", "required": false}
]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.anamnesis_templates WHERE title = 'Anamnese Facial Básica'
);

-- Mensagem de sucesso
SELECT 'Database setup completed successfully! All tables created or verified.' as status;
