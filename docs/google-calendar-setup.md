# Configuração do Google Calendar - JM Estética e Saúde

## Pré-requisitos

1. Conta Google ativa
2. Acesso ao Google Cloud Console
3. Projeto Supabase configurado

## Passo a Passo

### 1. Configurar Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Calendar API**:
   - Vá em "APIs & Services" > "Library"
   - Procure por "Google Calendar API"
   - Clique em "Enable"

### 2. Criar Credenciais OAuth 2.0

1. Vá em "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure:
   - Application type: **Web application**
   - Name: **JM Estética Calendar Integration**
   - Authorized redirect URIs: 
     - `https://seu-dominio.vercel.app/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback` (para desenvolvimento)

### 3. Configurar Variáveis de Ambiente

Adicione no seu projeto Vercel/Supabase:

\`\`\`env
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://seu-dominio.vercel.app/api/auth/google/callback
\`\`\`

### 4. Configurar Consentimento OAuth

1. No Google Cloud Console, vá em "OAuth consent screen"
2. Configure:
   - User Type: **External** (para uso público)
   - App name: **JM Estética e Saúde**
   - User support email: **jmmestetica.saude@gmail.com**
   - Scopes necessários:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`

### 5. Testar Integração

1. No sistema JM Estética, vá em **Configurações > Calendário**
2. Clique em **"Conectar Google Calendar"**
3. Autorize o acesso quando solicitado
4. Teste criando um agendamento e verificando se aparece no Google Calendar

## Funcionalidades Disponíveis

### Sincronização Automática
- ✅ Novos agendamentos são criados automaticamente no Google Calendar
- ✅ Alterações de horário são sincronizadas
- ✅ Cancelamentos removem eventos do Google Calendar

### Sincronização Manual
- ✅ Botão "Sincronizar Agora" no dashboard
- ✅ Importação de eventos existentes do Google Calendar
- ✅ Resolução de conflitos de horário

### Configurações Avançadas
- ✅ Escolher calendário específico para sincronização
- ✅ Definir lembretes automáticos (15 min, 1 hora, 1 dia antes)
- ✅ Personalizar títulos e descrições dos eventos

## Solução de Problemas

### Erro: "Access blocked"
- Verifique se o OAuth consent screen está configurado corretamente
- Adicione seu e-mail como usuário de teste durante desenvolvimento

### Eventos não sincronizam
- Verifique as permissões do calendário no Google
- Confirme se as variáveis de ambiente estão corretas
- Teste a conexão em Configurações > Calendário

### Conflitos de horário
- O sistema detecta automaticamente conflitos
- Use a função "Resolver Conflitos" no painel de calendário
- Priorize sempre os agendamentos do sistema JM Estética

## Suporte

Para problemas técnicos:
1. Verifique os logs no Supabase Dashboard
2. Teste a conexão OAuth em modo desenvolvimento
3. Entre em contato com suporte técnico se necessário

---

**Importante**: Mantenha suas credenciais Google seguras e nunca as compartilhe publicamente.
