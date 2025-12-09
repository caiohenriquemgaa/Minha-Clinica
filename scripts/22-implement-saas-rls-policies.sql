-- 22-implement-saas-rls-policies.sql
-- Implementa Row Level Security (RLS) com isolamento completo entre organizações
-- CRÍTICO para SaaS: cada clínica só vê dados dela própria

-- ===============================================
-- HELPER FUNCTIONS
-- ===============================================

-- Função para obter a organização do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Busca a organização padrão do perfil do usuário autenticado
  SELECT default_organization_id INTO org_id
  FROM profiles
  WHERE id = auth.uid();
  
  IF org_id IS NULL THEN
    -- Se não tem organização padrão, busca a primeira organização que é membro
    SELECT organization_id INTO org_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
    LIMIT 1;
  END IF;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============================================
-- PATIENTS TABLE - RLS
-- ===============================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Allow all for development" ON patients;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patients;
DROP POLICY IF EXISTS "patients_policy" ON patients;

-- SELECT: Usuário só vê pacientes da sua organização
CREATE POLICY "patients_select_own_org" ON patients
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- INSERT: Usuário insere pacientes na sua organização
CREATE POLICY "patients_insert_own_org" ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

-- UPDATE: Usuário atualiza pacientes da sua organização
CREATE POLICY "patients_update_own_org" ON patients
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- DELETE: Usuário deleta pacientes da sua organização
CREATE POLICY "patients_delete_own_org" ON patients
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- ===============================================
-- PROCEDURES TABLE - RLS
-- ===============================================

ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for development" ON procedures;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON procedures;
DROP POLICY IF EXISTS "procedures_policy" ON procedures;

CREATE POLICY "procedures_select_own_org" ON procedures
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "procedures_insert_own_org" ON procedures
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "procedures_update_own_org" ON procedures
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "procedures_delete_own_org" ON procedures
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- ===============================================
-- SESSIONS TABLE - RLS
-- ===============================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for development" ON sessions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON sessions;
DROP POLICY IF EXISTS "sessions_policy" ON sessions;

CREATE POLICY "sessions_select_own_org" ON sessions
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "sessions_insert_own_org" ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "sessions_update_own_org" ON sessions
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "sessions_delete_own_org" ON sessions
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- ===============================================
-- REMINDERS TABLE - RLS
-- ===============================================

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for development" ON reminders;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON reminders;

CREATE POLICY "reminders_select_own_org" ON reminders
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "reminders_insert_own_org" ON reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "reminders_update_own_org" ON reminders
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "reminders_delete_own_org" ON reminders
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- ===============================================
-- WORKER ACCESS (Service Role)
-- ===============================================
-- O worker usa SUPABASE_SERVICE_ROLE que bypassa RLS
-- Mas vamos criar policies para permitir leitura/escrita de qualquer organização quando necessário
-- (Service Role não é afetado por RLS, então isto é apenas para segurança futura)

-- ===============================================
-- TESTING
-- ===============================================

-- Para testar isolamento:
-- 1. Login como usuário da Clínica A
-- 2. SELECT * FROM patients; -- Só vê pacientes da Clínica A
-- 3. Tente INSERT paciente com organization_id de Clínica B --> ERRO (RLS bloqueará)
-- 4. Login como usuário da Clínica B
-- 5. SELECT * FROM patients; -- Só vê pacientes da Clínica B

RAISE NOTICE 'RLS policies implementadas com sucesso! Cada clínica só acessa dados dela própria.';
