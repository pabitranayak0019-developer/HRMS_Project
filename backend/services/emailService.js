const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[MAIL] SMTP not configured — skipping mail to ${to}: ${subject}`);
    return { skipped: true };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'HRMS <no-reply@hrms.local>',
      to,
      subject,
      html,
      text,
    });
    return { skipped: false };
  } catch (err) {
    console.error(`[MAIL] Failed to send to ${to}: ${err.message}`);
    return { skipped: false, error: err.message };
  }
};

module.exports = { sendMail };
