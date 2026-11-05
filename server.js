const express = require('express');
const http = require('http');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { spawn } = require('child_process');

const root = __dirname;
try {
  const env = fs.readFileSync(`${root}/.env`, 'utf8');
  env.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  });
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const publicPort = Number(process.env.PORT);
const phpPort = publicPort;
const app = express();
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

const smtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.INQUIRY_TO);
const mailer = smtpConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
  auth: { 
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
}) : null;

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

app.post('/', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const message = String(req.body.message || '').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !validEmail || !message) return res.redirect('/index.php?status=invalid#contact');
  if (!mailer) return res.redirect('/index.php?status=unconfigured#contact');

  try {
    await mailer.sendMail({
      from: `Azent Website <${process.env.SMTP_USER}>`,
      to: process.env.INQUIRY_TO,
      replyTo: email,
      subject: `Inquiry Azent — ${name}`,
      text: `Nama: ${name}\nEmail: ${email}\n\nPesan:\n${message}`,
      html: `<p><strong>Nama:</strong> ${esc(name)}</p><p><strong>Email:</strong> ${esc(email)}</p><p><strong>Pesan:</strong><br>${esc(message).replace(/\n/g, '<br>')}</p>`
    });
    return res.redirect('/index.php?status=sent#contact');
  } catch (error) {
    console.error('SMTP send failed:', error.message);
    return res.redirect('/index.php?status=failed#contact');
  }
});

const php = spawn('php', ['-S', `127.0.0.1:${phpPort}`, '-t', root], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
php.stderr.on('data', chunk => process.stderr.write(`[php] ${chunk}`));
php.on('error', error => { console.error('Tidak bisa menjalankan PHP:', error.message); process.exitCode = 1; });

app.use((req, res) => {
  const headers = { ...req.headers, host: `127.0.0.1:${phpPort}` };
  const proxyReq = http.request({ hostname: '127.0.0.1', port: phpPort, path: req.originalUrl, method: req.method, headers }, proxyRes => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', error => res.headersSent ? res.destroy(error) : res.status(502).send(`PHP bridge error: ${error.message}`));
  req.pipe(proxyReq);
});

const server = app.listen(publicPort, () => {
  console.log(`Azent berjalan di http://localhost:${publicPort}`);
  console.log(`SMTP inquiry: ${smtpConfigured ? 'configured' : 'not configured — set SMTP_USER, SMTP_PASS, INQUIRY_TO'}`);
});
function shutdown() { php.kill('SIGTERM'); server.close(() => process.exit(0)); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

