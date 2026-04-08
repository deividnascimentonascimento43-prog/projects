/**
 * OrionTec — Backend Server (Node.js + Express)
 * ================================================
 * COMO USAR:
 *   1. npm install
 *   2. Crie um arquivo .env com as variáveis abaixo
 *   3. node server.js
 *
 * DEPLOY RÁPIDO (Railway / Render / VPS):
 *   - Suba este arquivo + package.json
 *   - Configure as env vars no painel
 *   - Pronto!
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'oriontec_secret_mude_em_producao';

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── DB EM MEMÓRIA (substitua por MongoDB/PostgreSQL em produção) ──
const users = [];
const messages = [];

// ── HELPERS ────────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// ── EMAIL ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL] SMTP não configurado. E-mail não enviado.');
    return;
  }
  await transporter.sendMail({
    from: `"Orion Tec" <${process.env.SMTP_USER}>`,
    to, subject, html,
  });
}

// ════════════════════════════════════════════════════════════
// ROTAS DE AUTENTICAÇÃO
// ════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Preencha todos os campos.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' });

    const emailLower = email.toLowerCase().trim();
    if (users.find(u => u.email === emailLower))
      return res.status(409).json({ error: 'E-mail já cadastrado.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = {
      id: Date.now().toString(),
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    users.push(user);

    // E-mail de boas-vindas
    await sendEmail(user.email, 'Bem-vindo à Orion Tec! 🚀', `
      <h2>Olá, ${user.name.split(' ')[0]}!</h2>
      <p>Sua conta na <strong>Orion Tec</strong> foi criada com sucesso.</p>
      <p>Estamos prontos para transformar suas ideias em tecnologia real.</p>
      <br><p>— Equipe Orion Tec</p>
    `);

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Preencha todos os campos.' });

    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user)
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
});

// ════════════════════════════════════════════════════════════
// ROTA DE CONTATO
// ════════════════════════════════════════════════════════════

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, service, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });

    const msg = {
      id: Date.now().toString(),
      name, email, company: company || '-',
      service: service || '-', message,
      date: new Date().toISOString(),
    };
    messages.push(msg);

    // Notifica o admin
    await sendEmail(
      process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      `Nova mensagem de ${name} — Orion Tec`,
      `
        <h3>Nova mensagem pelo site</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Empresa:</strong> ${company || '-'}</p>
        <p><strong>Serviço:</strong> ${service || '-'}</p>
        <p><strong>Mensagem:</strong><br>${message}</p>
      `
    );

    // Confirma para o cliente
    await sendEmail(email, 'Recebemos sua mensagem — Orion Tec', `
      <h2>Olá, ${name}!</h2>
      <p>Recebemos sua mensagem e entraremos em contato em até <strong>24 horas úteis</strong>.</p>
      <p><em>"${message.slice(0,100)}${message.length>100?'...':''}"</em></p>
      <br><p>— Equipe Orion Tec</p>
    `);

    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
});

// GET /api/messages (protegido — admin)
app.get('/api/messages', authMiddleware, (req, res) => {
  res.json(messages);
});

// ── HEALTH CHECK ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), users: users.length });
});

// ── SERVE FRONTEND ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Orion Tec API rodando em http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponíveis:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   POST /api/contact`);
  console.log(`   GET  /api/health\n`);
});
