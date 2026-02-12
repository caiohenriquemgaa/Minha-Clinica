-- Habilitar RLS e criar políticas de segurança para JM Estética e Saúde
-- Execute este script após criar as tabelas principais

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Criar tabela anamnesis_templates (que estava faltando)
CREATE TABLE IF NOT EXISTS anamnesis_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  questions JSONB NOT NULL, -- Array de objetos com as perguntas do formulário
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users (apenas admins podem gerenciar usuários)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas RLS para patients (usuários autenticados podem gerenciar)
CREATE POLICY "Authenticated users can manage patients" ON patients FOR ALL USING (
  auth.role() = 'authenticated'
);

-- Políticas RLS para procedures (usuários autenticados podem visualizar, admins podem gerenciar)
CREATE POLICY "Authenticated users can view procedures" ON procedures FOR SELECT USING (
  auth.role() = 'authenticated'
);
CREATE POLICY "Admins can manage procedures" ON procedures FOR INSERT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update procedures" ON procedures FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete procedures" ON procedures FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas RLS para anamneses (usuários autenticados podem gerenciar)
CREATE POLICY "Authenticated users can manage anamneses" ON anamneses FOR ALL USING (
  auth.role() = 'authenticated'
);

-- Políticas RLS para anamnesis_templates (usuários autenticados podem visualizar, admins podem gerenciar)
CREATE POLICY "Authenticated users can view templates" ON anamnesis_templates FOR SELECT USING (
  auth.role() = 'authenticated'
);
CREATE POLICY "Admins can manage templates" ON anamnesis_templates FOR INSERT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update templates" ON anamnesis_templates FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete templates" ON anamnesis_templates FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas RLS para sessions (usuários autenticados podem gerenciar)
CREATE POLICY "Authenticated users can manage sessions" ON sessions FOR ALL USING (
  auth.role() = 'authenticated'
);

-- Inserir usuário master com credenciais corretas
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'jmmestetica.saude@gmail.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash para 'jmestetica2025'
  'JM Estética Master',
  'admin'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Inserir dados de exemplo para procedimentos
INSERT INTO procedures (name, description, category, duration_minutes, price) VALUES
('Limpeza de Pele Profunda', 'Limpeza facial completa com extração e hidratação', 'facial', 90, 120.00),
('Peeling Químico', 'Renovação celular com ácidos específicos', 'facial', 60, 200.00),
('Drenagem Linfática', 'Massagem para redução de inchaço e toxinas', 'corporal', 60, 80.00),
('Radiofrequência Facial', 'Tratamento para firmeza e rejuvenescimento', 'facial', 45, 150.00),
('Massagem Relaxante', 'Massagem corporal para alívio do estresse', 'corporal', 60, 100.00)
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_category ON anamnesis_templates(category);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
