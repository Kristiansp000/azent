const nodemailer = require('nodemailer');

function redirect(res, status) {
  res.writeHead(303, { Location: `/?status=${status}#contact` });
  res.end();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method not allowed');
  }

  const { name = '', email = '', message = '' } = req.body || {};
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim();
  const cleanMessage = String(message).trim();

  if (!cleanName || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(cleanEmail) || !cleanMessage) {
    return redirect(res, 'invalid');
  }

  const required = ['SMTP_USER', 'SMTP_PASS', 'INQUIRY_TO'];
  if (required.some(key => !process.env[key])) return redirect(res, 'unconfigured');

  const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  try {
    await mailer.sendMail({
      from: `Azent Website <${process.env.SMTP_USER}>`,
      to: process.env.INQUIRY_TO,
      replyTo: cleanEmail,
      subject: `Inquiry Azent — ${cleanName}`,
      text: `Nama: ${cleanName}\nEmail: ${cleanEmail}\n\nPesan:\n${cleanMessage}`,
      html: `<p><strong>Nama:</strong> ${escapeHtml(cleanName)}</p><p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p><p><strong>Pesan:</strong><br>${escapeHtml(cleanMessage).replace(/\n/g, '<br>')}</p>`
    });
    return redirect(res, 'sent');
  } catch (error) {
    console.error('SMTP send failed:', error.message);
    return redirect(res, 'failed');
  }
};
