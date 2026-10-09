const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function notifyNewLead(lead) {
  const t = getTransporter();
  const to = process.env.NOTIFY_EMAIL;
  if (!t || !to) {
    console.log('[mailer] SMTP/NOTIFY_EMAIL not configured — lead saved to dashboard only (#' + lead.id + ')');
    return false;
  }
  const urgent = lead.urgency === 'emergency';
  const subject = `${urgent ? '🚨 EMERGENCY — ' : ''}New septic request: ${lead.name} (${lead.town || 'town n/a'})`;
  const rows = [
    ['Name', lead.name], ['Phone', lead.phone], ['Email', lead.email], ['Town', lead.town],
    ['Service', lead.service], ['Urgency', lead.urgency], ['Last pumped', lead.last_pumped], ['Details', lead.message]
  ].map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:700;background:#f2f7f2">${k}</td><td style="padding:6px 12px">${esc(v) || '—'}</td></tr>`).join('');

  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      replyTo: lead.email || undefined,
      subject,
      text: `New request from ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email || '-'}\nTown: ${lead.town || '-'}\nService: ${lead.service || '-'}\nUrgency: ${lead.urgency || '-'}\nLast pumped: ${lead.last_pumped || '-'}\n\n${lead.message || ''}`,
      html: `<div style="font-family:Arial,sans-serif"><h2 style="color:#1f8a2e">New request from the website</h2><table style="border-collapse:collapse;border:1px solid #ddd">${rows}</table><p><a href="tel:${esc(lead.phone)}">Call ${esc(lead.name)} back</a></p></div>`
    });
    return true;
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    return false;
  }
}

module.exports = { notifyNewLead };
