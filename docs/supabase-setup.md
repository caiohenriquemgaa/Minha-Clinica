# Supabase & fontes de dados

Este projeto já vem preparado para dois cenários:

1. **Mock local (padrão)** — ideal para testar a interface rapidamente.
2. **Supabase** — usa o banco e RLS reais assim que você estiver pronto.

## 1. Testes locais com mock

1. Copie o arquivo `.env.example` para `.env.local`.
2. Garanta que `NEXT_PUBLIC_DATA_SOURCE=mock`. Com isso, `lib/sessions`, `lib/procedures` e o dashboard usam os dados em memória.
3. Rode o app normalmente: `npm install` e `npm run dev`.

## 2. Habilitando Supabase

1. Crie um projeto em [Supabase](https://supabase.com/) e gere as chaves públicas (URL + anon key).
2. No SQL Editor do Supabase, execute o script [`scripts/02-supabase-setup-instructions.sql`](../scripts/02-supabase-setup-instructions.sql). Ele cria:
   - `profiles`, `patients`, `procedures`, `sessions`, templates/anamneses e respectivos índices/políticas.
   - Campos extras em `sessions` para `professional_*`, `room` e integrações futuras com Google Calendar.
3. Ative RLS (já incluído no script) e, se preciso, ajuste as políticas para o seu fluxo.
4. Atualize o `.env.local` com:

   ```bash
   NEXT_PUBLIC_DATA_SOURCE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=chave_anon_publica
   ```

5. Reinicie o servidor Next.js. O dashboard detecta automaticamente a origem e exibe o selo “Fonte de dados: Supabase”.

## Como funciona o switch

- `lib/data-source.ts` resolve a fonte com base nas variáveis. Se as variáveis do Supabase não estiverem presentes ou `NEXT_PUBLIC_DATA_SOURCE` não for `supabase`, ficamos no modo mock.
- `lib/supabase-client.ts` cria o cliente compartilhado `createBrowserClient`.
- `lib/sessions.ts` consulta o Supabase (com joins de pacientes/procedimentos, mapeamento de status PT ↔︎ EN e CRUD completo). Sem Supabase, continua com o dataset em memória.
- O dashboard mostra a origem atual e continua funcionando em ambos os modos, inclusive para os lembretes automáticos.

Assim você consegue desenvolver e validar tudo localmente e, quando desejar, apenas alterar as variáveis para conectar ao banco real.*** End Patch
