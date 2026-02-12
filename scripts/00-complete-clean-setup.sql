-- JM Estética e Saúde - Complete Database Setup
-- This script can be run multiple times safely on an empty or existing database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255), -- Added for compatibility
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Patients table for client management
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  birth_date DATE,
  gender VARCHAR(20),
  address JSONB, -- Store as JSON for flexibility
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  emergency_contact VARCHAR(255), -- Emergency contact name
  emergency_phone VARCHAR(20), -- Emergency contact phone
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to patients if they don't exist
DO $$ BEGIN
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Procedures table for available treatments
CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  price DECIMAL(10,2),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions/Appointments table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES procedures(id),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status session_status DEFAULT 'scheduled',
  notes TEXT,
  price DECIMAL(10,2),
  google_calendar_event_id VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anamnesis templates table
CREATE TABLE IF NOT EXISTS anamnesis_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anamneses table for medical history forms
CREATE TABLE IF NOT EXISTS anamneses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES anamnesis_templates(id),
  title VARCHAR(255) NOT NULL,
  questions JSONB NOT NULL,
  responses JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anamnesis responses table
CREATE TABLE IF NOT EXISTS anamnesis_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anamnesis_id UUID REFERENCES anamneses(id) ON DELETE CASCADE,
  question_id VARCHAR(255) NOT NULL,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_anamneses_patient_id ON anamneses(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_anamnesis_id ON anamnesis_responses(anamnesis_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users policies
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;
CREATE POLICY "Allow authenticated users to read users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow users to update own profile" ON users;
CREATE POLICY "Allow users to update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Patients policies
DROP POLICY IF EXISTS "Allow authenticated users full access to patients" ON patients;
CREATE POLICY "Allow authenticated users full access to patients" ON patients
  FOR ALL USING (auth.role() = 'authenticated');

-- Procedures policies
DROP POLICY IF EXISTS "Allow authenticated users to read procedures" ON procedures;
CREATE POLICY "Allow authenticated users to read procedures" ON procedures
  FOR SELECT USING (auth.role() = 'authenticated');

-- Sessions policies
DROP POLICY IF EXISTS "Allow authenticated users full access to sessions" ON sessions;
CREATE POLICY "Allow authenticated users full access to sessions" ON sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- Anamneses policies
DROP POLICY IF EXISTS "Allow authenticated users full access to anamneses" ON anamneses;
CREATE POLICY "Allow authenticated users full access to anamneses" ON anamneses
  FOR ALL USING (auth.role() = 'authenticated');

-- Anamnesis templates policies
DROP POLICY IF EXISTS "Allow all access to anamnesis_templates" ON anamnesis_templates;
CREATE POLICY "Allow all access to anamnesis_templates" ON anamnesis_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Anamnesis responses policies
DROP POLICY IF EXISTS "Allow authenticated users full access to anamnesis_responses" ON anamnesis_responses;
CREATE POLICY "Allow authenticated users full access to anamnesis_responses" ON anamnesis_responses
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert master admin user with proper email
INSERT INTO users (id, email, password_hash, name, full_name, role, is_active) 
VALUES (
  'c64ae1e6-998f-43f1-a8ce-7da7a6d01b38',
  'jmmestetica.saude@gmail.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'JM Estética Master Admin',
  'JM Estética e Saúde - Administrador',
  'admin',
  true
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Insert sample procedures
INSERT INTO procedures (name, description, duration_minutes, price, category) VALUES
('Limpeza de Pele', 'Limpeza profunda da pele com extração de cravos', 60, 80.00, 'facial'),
('Hidratação Facial', 'Tratamento hidratante para todos os tipos de pele', 45, 60.00, 'facial'),
('Peeling Químico', 'Renovação celular com ácidos específicos', 90, 150.00, 'facial'),
('Massagem Relaxante', 'Massagem corporal para alívio do estresse', 60, 100.00, 'corporal'),
('Drenagem Linfática', 'Técnica para redução de inchaço e toxinas', 75, 120.00, 'corporal')
ON CONFLICT DO NOTHING;

-- Insert sample anamnesis template
INSERT INTO anamnesis_templates (name, description, questions) VALUES
('Anamnese Facial Básica', 'Questionário básico para tratamentos faciais', 
'[
  {"id": "skin_type", "question": "Qual seu tipo de pele?", "type": "select", "options": ["Oleosa", "Seca", "Mista", "Normal"]},
  {"id": "allergies", "question": "Possui alguma alergia conhecida?", "type": "text"},
  {"id": "medications", "question": "Faz uso de algum medicamento?", "type": "text"},
  {"id": "previous_treatments", "question": "Já realizou tratamentos estéticos anteriormente?", "type": "textarea"}
]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create storage bucket for patient images (if using Supabase Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-images', 'patient-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for patient images
DROP POLICY IF EXISTS "Allow authenticated users to upload patient images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload patient images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'patient-images' AND 
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Allow authenticated users to view patient images" ON storage.objects;
CREATE POLICY "Allow authenticated users to view patient images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'patient-images' AND 
    auth.role() = 'authenticated'
  );

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Admin user created: jmmestetica.saude@gmail.com';
    RAISE NOTICE 'Sample procedures and anamnesis template added.';
END $$;
