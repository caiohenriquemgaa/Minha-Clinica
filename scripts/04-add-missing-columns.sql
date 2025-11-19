-- Script para adicionar colunas ausentes de forma segura
-- Execute este script se houver erros sobre colunas não existentes

-- Adicionar coluna is_active na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'is_active') THEN
        ALTER TABLE patients ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Adicionar coluna is_active na tabela procedures se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'procedures' AND column_name = 'is_active') THEN
        ALTER TABLE procedures ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Adicionar coluna is_active na tabela anamnesis_templates se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'anamnesis_templates' AND column_name = 'is_active') THEN
        ALTER TABLE anamnesis_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Adicionar coluna phone na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'phone') THEN
        ALTER TABLE patients ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- Adicionar coluna address na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'address') THEN
        ALTER TABLE patients ADD COLUMN address TEXT;
    END IF;
END $$;

-- Adicionar coluna emergency_contact na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'emergency_contact') THEN
        ALTER TABLE patients ADD COLUMN emergency_contact VARCHAR(100);
    END IF;
END $$;

-- Adicionar coluna emergency_phone na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'emergency_phone') THEN
        ALTER TABLE patients ADD COLUMN emergency_phone VARCHAR(20);
    END IF;
END $$;

-- Adicionar coluna medical_history na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'medical_history') THEN
        ALTER TABLE patients ADD COLUMN medical_history TEXT;
    END IF;
END $$;

-- Adicionar coluna allergies na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'allergies') THEN
        ALTER TABLE patients ADD COLUMN allergies TEXT;
    END IF;
END $$;

-- Adicionar coluna medications na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'medications') THEN
        ALTER TABLE patients ADD COLUMN medications TEXT;
    END IF;
END $$;

-- Adicionar coluna height na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'height') THEN
        ALTER TABLE patients ADD COLUMN height DECIMAL(5,2);
    END IF;
END $$;

-- Adicionar coluna weight na tabela patients se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'weight') THEN
        ALTER TABLE patients ADD COLUMN weight DECIMAL(5,2);
    END IF;
END $$;

-- Adicionar coluna duration_minutes na tabela procedures se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'procedures' AND column_name = 'duration_minutes') THEN
        ALTER TABLE procedures ADD COLUMN duration_minutes INTEGER DEFAULT 60;
    END IF;
END $$;

-- Adicionar coluna price na tabela procedures se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'procedures' AND column_name = 'price') THEN
        ALTER TABLE procedures ADD COLUMN price DECIMAL(10,2);
    END IF;
END $$;

-- Adicionar coluna category na tabela procedures se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'procedures' AND column_name = 'category') THEN
        ALTER TABLE procedures ADD COLUMN category VARCHAR(50) DEFAULT 'facial';
    END IF;
END $$;

-- Adicionar coluna notes na tabela sessions se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'notes') THEN
        ALTER TABLE sessions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Adicionar coluna google_calendar_event_id na tabela sessions se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'google_calendar_event_id') THEN
        ALTER TABLE sessions ADD COLUMN google_calendar_event_id VARCHAR(255);
    END IF;
END $$;

-- Verificar e atualizar tipos de dados se necessário
-- Atualizar status enum na tabela sessions se necessário
DO $$
BEGIN
    -- Verificar se o tipo enum existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
        ALTER TABLE sessions ALTER COLUMN status TYPE session_status USING status::session_status;
    END IF;
END $$;

-- Atualizar category enum na tabela procedures se necessário
DO $$
BEGIN
    -- Verificar se o tipo enum existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'procedure_category') THEN
        CREATE TYPE procedure_category AS ENUM ('facial', 'corporal', 'capilar', 'estetica_avancada');
        ALTER TABLE procedures ALTER COLUMN category TYPE procedure_category USING category::procedure_category;
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_procedure_id ON sessions(procedure_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_patient_id ON anamnesis_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_template_id ON anamnesis_responses(template_id);

-- Atualizar dados existentes se necessário
UPDATE patients SET is_active = true WHERE is_active IS NULL;
UPDATE procedures SET is_active = true WHERE is_active IS NULL;
UPDATE anamnesis_templates SET is_active = true WHERE is_active IS NULL;

-- Mensagem de sucesso
SELECT 'Todas as colunas ausentes foram adicionadas com sucesso!' as resultado;
