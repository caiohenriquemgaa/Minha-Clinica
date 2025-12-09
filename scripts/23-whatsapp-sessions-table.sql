-- 23-whatsapp-sessions-table.sql
-- Tabela para armazenar sessões do WhatsApp por organização

-- Tabela principal de sessões WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Estado da sessão Baileys
  auth_state jsonb DEFAULT NULL,  -- Dados de autenticação do WhatsApp
  phone_number text DEFAULT NULL,  -- Número do WhatsApp conectado (ex: 5511999999999)
  
  -- Status
  status text DEFAULT 'disconnected',  -- 'scanning' | 'connected' | 'disconnected' | 'error'
  qr_code text DEFAULT NULL,  -- QR em base64 para exibir na UI
  last_error text DEFAULT NULL,  -- Mensagem de erro se houver
  
  -- Timestamps
  connected_at timestamp with time zone DEFAULT NULL,
  disconnected_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX idx_whatsapp_sessions_org ON public.whatsapp_sessions(organization_id);
CREATE INDEX idx_whatsapp_sessions_status ON public.whatsapp_sessions(status);

-- Tabela de log para auditoria
CREATE TABLE IF NOT EXISTS public.whatsapp_send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reminder_id uuid NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  
  phone_number text NOT NULL,
  message_preview text,  -- Primeiros 100 chars da mensagem
  
  status text NOT NULL,  -- 'success' | 'failed' | 'pending'
  error_message text DEFAULT NULL,
  
  attempt_number integer DEFAULT 1,
  
  sent_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX idx_whatsapp_logs_org ON public.whatsapp_send_logs(organization_id);
CREATE INDEX idx_whatsapp_logs_reminder ON public.whatsapp_send_logs(reminder_id);
CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_send_logs(status);

-- RLS Policies
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_send_logs ENABLE ROW LEVEL SECURITY;

-- WhatsApp Sessions RLS
DROP POLICY IF EXISTS "whatsapp_sessions_own_org" ON public.whatsapp_sessions;
CREATE POLICY "whatsapp_sessions_own_org" ON public.whatsapp_sessions
  FOR ALL
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- WhatsApp Logs RLS
DROP POLICY IF EXISTS "whatsapp_logs_own_org" ON public.whatsapp_send_logs;
CREATE POLICY "whatsapp_logs_own_org" ON public.whatsapp_send_logs
  FOR ALL
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- Service role can access all
DROP POLICY IF EXISTS "whatsapp_sessions_service_role" ON public.whatsapp_sessions;
CREATE POLICY "whatsapp_sessions_service_role" ON public.whatsapp_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "whatsapp_logs_service_role" ON public.whatsapp_send_logs;
CREATE POLICY "whatsapp_logs_service_role" ON public.whatsapp_send_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE 'WhatsApp sessions table created successfully!';
END $$;
