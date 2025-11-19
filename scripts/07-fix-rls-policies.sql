-- Fix RLS Policies with Correct Syntax
-- Execute este script para corrigir os erros de sintaxe das políticas RLS

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can view patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can view procedures" ON procedures;
DROP POLICY IF EXISTS "Authenticated users can insert procedures" ON procedures;
DROP POLICY IF EXISTS "Authenticated users can update procedures" ON procedures;
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can view anamneses" ON anamneses;
DROP POLICY IF EXISTS "Authenticated users can insert anamneses" ON anamneses;
DROP POLICY IF EXISTS "Authenticated users can update anamneses" ON anamneses;
DROP POLICY IF EXISTS "Authenticated users can view templates" ON anamnesis_templates;
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON anamnesis_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON anamnesis_templates;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with correct syntax
-- Users table policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Patients table policies
CREATE POLICY "Authenticated users can view patients" ON patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patients" ON patients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patients" ON patients
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Procedures table policies
CREATE POLICY "Authenticated users can view procedures" ON procedures
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert procedures" ON procedures
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update procedures" ON procedures
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Sessions table policies
CREATE POLICY "Authenticated users can view sessions" ON sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sessions" ON sessions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sessions" ON sessions
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Anamneses table policies
CREATE POLICY "Authenticated users can view anamneses" ON anamneses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert anamneses" ON anamneses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update anamneses" ON anamneses
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Anamnesis templates table policies
CREATE POLICY "Authenticated users can view templates" ON anamnesis_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert templates" ON anamnesis_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update templates" ON anamnesis_templates
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create anamnesis_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS anamnesis_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample anamnesis template
INSERT INTO anamnesis_templates (title, description, category, questions) VALUES
('Anamnese Facial Básica', 'Questionário padrão para tratamentos faciais', 'facial', 
'[
  {"id": 1, "type": "text", "question": "Qual é o seu tipo de pele?", "required": true},
  {"id": 2, "type": "multiple_choice", "question": "Você tem alguma alergia conhecida?", "options": ["Sim", "Não"], "required": true},
  {"id": 3, "type": "textarea", "question": "Descreva sua rotina de cuidados com a pele:", "required": false},
  {"id": 4, "type": "multiple_choice", "question": "Você está grávida ou amamentando?", "options": ["Sim", "Não"], "required": true},
  {"id": 5, "type": "text", "question": "Que medicamentos você está tomando atualmente?", "required": false}
]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert sample data
INSERT INTO procedures (name, description, category, duration_minutes, price) VALUES
('Limpeza de Pele Profunda', 'Limpeza facial completa com extração e hidratação', 'facial', 90, 120.00),
('Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 60, 200.00),
('Drenagem Linfática', 'Massagem para redução de inchaço e toxinas', 'corporal', 60, 80.00),
('Radiofrequência Facial', 'Tratamento para firmeza e rejuvenescimento', 'facial', 45, 150.00),
('Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 60, 100.00)
ON CONFLICT DO NOTHING;

-- Insert sample patients
INSERT INTO patients (name, email, phone, birth_date, gender, address, emergency_contact, emergency_phone) VALUES
('Maria Silva', 'maria.silva@email.com', '(11) 99999-1111', '1985-03-15', 'feminino', 'Rua das Flores, 123 - São Paulo, SP', 'João Silva', '(11) 99999-2222'),
('Ana Costa', 'ana.costa@email.com', '(11) 99999-3333', '1990-07-22', 'feminino', 'Av. Paulista, 456 - São Paulo, SP', 'Carlos Costa', '(11) 99999-4444'),
('Pedro Lima', 'pedro.lima@email.com', '(11) 99999-5555', '1988-12-10', 'masculino', 'Rua Augusta, 789 - São Paulo, SP', 'Lucia Lima', '(11) 99999-6666')
ON CONFLICT DO NOTHING;

COMMIT;
