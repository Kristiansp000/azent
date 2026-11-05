const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

try {
  const env = fs.readFileSync(`${__dirname}/.env`, 'utf8');
  env.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const app = express();
const root = __dirname;

app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(root));
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));

const smtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.INQUIRY_TO);
const mailer = smtpConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}) : null;

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

app.post('/api/send-email', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const message = String(req.body.message || '').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const redirect = status => res.redirect(303, `/?status=${status}#contact`);

  if (!name || !validEmail || !message) return redirect('invalid');
  if (!mailer) return redirect('unconfigured');

  try {
    await mailer.sendMail({
      from: `Azent Website <${process.env.SMTP_USER}>`,
      to: process.env.INQUIRY_TO,
      replyTo: email,
      subject: `Inquiry Azent — ${name}`,
      text: `Nama: ${name}\nEmail: ${email}\n\nPesan:\n${message}`,
      html: `<p><strong>Nama:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Pesan:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
    });
    return redirect('sent');
  } catch (error) {
    console.error('SMTP send failed:', error.message);
    return redirect('failed');
  }
});

module.exports = app;