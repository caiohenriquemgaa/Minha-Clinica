-- Atualiza nomes legados de clínica para a nova marca EstetiTech
-- Execute no SQL Editor do Supabase

update organizations
set name = 'EstetiTech',
    updated_at = now()
where lower(trim(name)) in (
  'minha clinica',
  'minha clínica',
  'jm estetica',
  'jm estética',
  'jm estetica e saude',
  'jm estética e saúde'
);

-- Conferência
select id, name, contact_email, status, updated_at
from organizations
order by updated_at desc nulls last, created_at desc;
