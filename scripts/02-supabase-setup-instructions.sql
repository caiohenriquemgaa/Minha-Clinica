-- =====================================================
-- JM ESTÉTICA E SAÚDE - SUPABASE DATABASE SETUP
-- =====================================================

-- INSTRUÇÕES PARA CONFIGURAÇÃO DO SUPABASE:
-- 
-- 1. Acesse https://supabase.com e crie um novo projeto
-- 2. Vá em Settings > Database e copie a Connection String
-- 3. No v0, adicione a integração Supabase nas configurações do projeto
-- 4. Execute os scripts SQL abaixo no SQL Editor do Supabase
-- 5. Configure as políticas RLS (Row Level Security) conforme indicado

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de usuários (estende auth.users do Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pacientes
CREATE TABLE public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro')),
  address JSONB, -- {street, city, state, zip_code}
  emergency_contact JSONB, -- {name, phone, relationship}
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  height DECIMAL(5,2), -- em metros
  weight DECIMAL(5,2), -- em kg
  bmi DECIMAL(4,2) GENERATED ALWAYS AS (
    CASE 
      WHEN height > 0 THEN weight / (height * height)
      ELSE NULL
    END
  ) STORED,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de procedimentos
CREATE TABLE public.procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- facial, corporal, capilar, etc.
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de templates de anamnese
CREATE TABLE public.anamnesis_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  questions JSONB NOT NULL, -- Array de objetos com perguntas
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas de anamnese
CREATE TABLE public.anamnesis_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.anamnesis_templates(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  responses JSONB NOT NULL, -- Respostas do paciente
  status TEXT CHECK (status IN ('pendente', 'preenchida', 'revisada')) DEFAULT 'pendente',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões/agendamentos
CREATE TABLE public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedures(id),
  professional_id UUID REFERENCES public.profiles(id),
  professional_name TEXT,
  professional_specialty TEXT,
  room TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT CHECK (status IN ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'agendado',
  notes TEXT,
  price DECIMAL(10,2),
  google_calendar_event_id TEXT, -- Para sincronização com Google Calendar
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_patients_email ON public.patients(email);
CREATE INDEX idx_patients_active ON public.patients(is_active);
CREATE INDEX idx_sessions_date ON public.sessions(scheduled_date);
CREATE INDEX idx_sessions_patient ON public.sessions(patient_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_professional ON public.sessions(professional_id);
CREATE INDEX idx_anamnesis_responses_patient ON public.anamnesis_responses(patient_id);
CREATE INDEX idx_anamnesis_responses_status ON public.anamnesis_responses(status);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para pacientes (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem ver pacientes" ON public.patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir pacientes" ON public.patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar pacientes" ON public.patients
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas similares para outras tabelas
CREATE POLICY "Usuários autenticados podem acessar procedimentos" ON public.procedures
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem acessar anamneses" ON public.anamnesis_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem acessar respostas" ON public.anamnesis_responses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem acessar sessões" ON public.sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON public.procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anamnesis_templates_updated_at BEFORE UPDATE ON public.anamnesis_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anamnesis_responses_updated_at BEFORE UPDATE ON public.anamnesis_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir procedimentos básicos
INSERT INTO public.procedures (name, description, category, duration_minutes, price) VALUES
('Limpeza de Pele Profunda', 'Limpeza facial completa com extração e hidratação', 'facial', 90, 120.00),
('Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 60, 200.00),
('Drenagem Linfática', 'Massagem para redução de inchaço e toxinas', 'corporal', 60, 80.00),
('Radiofrequência Facial', 'Tratamento para firmeza e rejuvenescimento', 'facial', 45, 150.00),
('Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 60, 100.00);

-- Template básico de anamnese
INSERT INTO public.anamnesis_templates (title, description, category, questions) VALUES
('Anamnese Facial Básica', 'Questionário padrão para tratamentos faciais', 'facial', 
'[
  {"id": 1, "type": "text", "question": "Qual é o seu tipo de pele?", "required": true},
  {"id": 2, "type": "multiple_choice", "question": "Você tem alguma alergia conhecida?", "options": ["Sim", "Não"], "required": true},
  {"id": 3, "type": "textarea", "question": "Descreva sua rotina de cuidados com a pele:", "required": false},
  {"id": 4, "type": "multiple_choice", "question": "Você está grávida ou amamentando?", "options": ["Sim", "Não"], "required": true},
  {"id": 5, "type": "text", "question": "Que medicamentos você está tomando atualmente?", "required": false}
]'::jsonb);
