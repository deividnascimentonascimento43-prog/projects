# 🚀 Orion Tec — Site Completo

## Estrutura
```
oriontec/
├── index.html      ← Site completo (funciona sozinho sem backend)
├── server.js       ← Backend Node.js (para produção)
├── package.json    ← Dependências do backend
└── .env.example    ← Variáveis de ambiente
```

---

## ▶️ Opção 1 — Só o HTML (mais rápido, sem servidor)

Abra o `index.html` no navegador. Funciona 100%:
- ✅ Login e cadastro (dados salvos no navegador)
- ✅ Formulário de contato
- ✅ Todas as animações e seções

**Para hospedar gratuitamente:**
- [Netlify](https://netlify.com) — arraste o `index.html` e pronto
- [Vercel](https://vercel.com) — suba o arquivo
- [GitHub Pages](https://pages.github.com) — commit e ativa nas settings

---

## ▶️ Opção 2 — Com Backend Real (Node.js)

### Instalação local:
```bash
npm install
cp .env.example .env
# edite o .env com seus dados
node server.js
```

### Deploy no Railway (gratuito):
1. Acesse [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Suba este repositório
4. Configure as variáveis de ambiente no painel
5. ✅ Pronto! URL gerada automaticamente

### Deploy no Render (gratuito):
1. Acesse [render.com](https://render.com)
2. "New Web Service" → conecte o GitHub
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Configure as env vars
6. ✅ Deploy automático!

---

## 🔑 APIs do Backend

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/contact` | Enviar mensagem de contato |
| GET | `/api/health` | Status da API |

---

## 📧 Configurar Gmail para e-mails

1. Ative "Verificação em 2 etapas" no Google
2. Gere uma "Senha de app" em: myaccount.google.com → Segurança → Senhas de app
3. Use essa senha no `.env` como `SMTP_PASS`

---

Feito com 💙 por **Orion Tec** — CEO: Deivid Nascimento
