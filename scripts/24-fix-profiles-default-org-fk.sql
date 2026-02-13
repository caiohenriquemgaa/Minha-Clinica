-- Corrige FK de profiles.default_organization_id para não bloquear remoção de organização
-- Com ON DELETE SET NULL, ao apagar uma organização o perfil é desvinculado automaticamente.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_default_organization_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_organization_id_fkey
  FOREIGN KEY (default_organization_id)
  REFERENCES public.organizations(id)
  ON DELETE SET NULL;
