const nodemailer = require('nodemailer');

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method not allowed');
  }

  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();
  const redirect = status => res.redirect(303, `/?status=${status}#contact`);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return redirect('invalid');
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.INQUIRY_TO) {
    return redirect('unconfigured');
  }

  const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

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
};