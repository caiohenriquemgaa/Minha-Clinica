-- Criar apenas a tabela anamnesis_templates que está faltando
CREATE TABLE IF NOT EXISTS public.anamnesis_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'facial',
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso total (temporário)
CREATE POLICY "Allow all access to anamnesis_templates" ON public.anamnesis_templates
    FOR ALL USING (true) WITH CHECK (true);

-- Inserir template de exemplo
INSERT INTO public.anamnesis_templates (title, description, category, questions) VALUES
('Anamnese Facial Básica', 'Questionário padrão para tratamentos faciais', 'facial', 
'[
  {"id": 1, "type": "text", "question": "Qual é o seu tipo de pele?", "required": true},
  {"id": 2, "type": "multiple_choice", "question": "Você tem alguma alergia conhecida?", "options": ["Sim", "Não"], "required": true},
  {"id": 3, "type": "textarea", "question": "Descreva sua rotina de cuidados com a pele:", "required": false},
  {"id": 4, "type": "multiple_choice", "question": "Você está grávida ou amamentando?", "options": ["Sim", "Não"], "required": true},
  {"id": 5, "type": "text", "question": "Que medicamentos você está tomando atualmente?", "required": false}
]'::jsonb);
