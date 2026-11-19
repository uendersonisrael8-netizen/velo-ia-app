# velo ia · app

O app Android da **velo ia**, separado da rede social velo e instalável ao lado
dela. Usa a **mesma conta** e o **mesmo histórico** da IA na rede social.

<p align="center">
  <img src="docs/icon.png" alt="Ícone da velo ia" width="120" />
</p>

## O que tem

- Login com a conta Supabase da velo (e-mail e senha).
- Histórico de conversas sincronizado entre o app e a rede social.
- Drawer com todas as conversas, renomeação automática pelo primeiro assunto e
  exclusão.
- Composer fixo, envio com Enter, quebra de linha com Shift + Enter e anexo de
  imagem comprimida no aparelho.
- Tema claro e escuro, com a paleta papel + tinta + laranja da velo.
- Funciona como app nativo (Capacitor) e também como site (Vite).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Interface | React 19 + TypeScript + Vite |
| App nativo | Capacitor 8 (Android) |
| Autenticação | Supabase Auth |
| IA e histórico | API da velo (`/api/ai/*`) |

O app não fala com a Groq. A chave da IA continua só no servidor da velo, e o
WebView usa `Authorization: Bearer <access_token>` porque cookies do navegador
não são compartilhados com o app nativo.

## Rodar no navegador

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
```

Variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
VITE_VELO_API_URL=https://velo-iota-bice.vercel.app
```

`VITE_VELO_API_URL` é opcional; sem ela o app usa a produção da velo.

## Gerar o APK

O APK é gerado automaticamente pelo GitHub Actions a cada push na `main`.

1. Abra a aba **Actions** do repositório.
2. Entre no workflow **build apk** mais recente.
3. Baixe o artifact **velo-ia-apk**.
4. No celular, permita a instalação de apps desconhecidos para o app de arquivos
   ou navegador e abra o `app-debug.apk`.

Para uma versão com tag e release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

O APK também fica anexado na release.

### Build local (opcional)

Precisa de Node 22+, JDK 21 e Android SDK 36:

```bash
npm ci
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

O APK sai em `android/app/build/outputs/apk/debug/app-debug.apk`.

> Esta primeira versão é **debug**, instalável e sem assinatura de loja. Para
> publicar na Play Store será preciso gerar um keystore e assinar o release.

O APK de debug usa uma chave fixa commitada em
`android/app/velo-debug.jks` (senha `android`, alias `androiddebugkey`). Ela não
é um segredo e não serve para publicar na loja; está ali só para que uma versão
nova do APK instale por cima da anterior sem precisar desinstalar.

## Variáveis do GitHub Actions

Em **Settings → Secrets and variables → Actions → Variables**, crie:

| Variável | Valor |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase da velo |
| `VITE_SUPABASE_ANON_KEY` | chave anon/publishable do Supabase |
| `VITE_VELO_API_URL` | opcional; URL da API em produção |

A chave anon é pública por design. Nunca coloque a `GROQ_API_KEY` aqui: ela
pertence apenas ao deploy do servidor.

## Histórico compartilhado

O servidor guarda as conversas em `ai_conversations` e `ai_messages`, com RLS
por usuário. A migração fica no repositório da rede social:

```text
supabase/migrations/20261118_ai_conversations.sql
```

Enquanto ela não for aplicada no Supabase, o app avisa que o histórico
compartilhado ainda não foi ativado e o chat continua respondendo, mas sem
salvar as conversas no servidor.

## Estrutura

```text
src/
  components/     telas, drawer, mensagens e composer
  lib/api.ts      cliente das rotas /api/ai com Bearer token
  lib/supabase.ts sessão persistida no WebView
  lib/images.ts   compressão da foto antes do envio
  styles.css      identidade visual e temas
android/          projeto nativo (ícone, splash e assinatura)
.github/          workflow que gera o APK
```

## Segurança

- A sessão fica no armazenamento do WebView, com refresh automático do token.
- O servidor valida o JWT e o RLS impede acessar conversas de outra conta.
- O app só aceita HTTPS em produção e não carrega conteúdo externo no WebView.
- Imagens são comprimidas para ~2 MB antes de sair do aparelho.

---

feito com calma para a velo · um espaço para falar do dia, das ideias e do que
vier.
