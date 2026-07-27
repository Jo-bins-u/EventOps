const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_USER) {
    console.log(`[Email skipped — SMTP not configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `EventOps <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

const taskAssignedEmail = (userName, taskTitle, dueDate, eventName) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
  <h2 style="color:#185FA5;margin-bottom:8px;">New Task Assigned</h2>
  <p>Hi ${userName},</p>
  <p>You have been assigned a new task on <strong>EventOps Platform</strong>.</p>
  <div style="background:#f1f0e8;border-radius:8px;padding:16px;margin:16px 0;">
    <div style="font-size:16px;font-weight:500;margin-bottom:6px;">${taskTitle}</div>
    <div style="font-size:13px;color:#5f5e5a;">Event: ${eventName || 'N/A'}</div>
    ${dueDate ? `<div style="font-size:13px;color:#A32D2D;margin-top:4px;">Due: ${new Date(dueDate).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</div>` : ''}
  </div>
  <a href="${process.env.CLIENT_URL}/tasks" style="display:inline-block;background:#185FA5;color:#fff;padding:10px 20px;border-radius:7px;text-decoration:none;font-size:13px;">View Task</a>
  <p style="margin-top:24px;font-size:12px;color:#888780;">EventOps Platform — Internal Coordination System</p>
</div>
`;

const overdueTaskEmail = (userName, tasks) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
  <h2 style="color:#A32D2D;margin-bottom:8px;">Overdue Tasks</h2>
  <p>Hi ${userName}, you have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''}:</p>
  <ul style="background:#f1f0e8;border-radius:8px;padding:16px 16px 16px 32px;">
    ${tasks.map(t => `<li style="margin-bottom:6px;font-size:13px;"><strong>${t.title}</strong> — was due ${new Date(t.dueDate).toLocaleDateString()}</li>`).join('')}
  </ul>
  <a href="${process.env.CLIENT_URL}/tasks" style="display:inline-block;background:#A32D2D;color:#fff;padding:10px 20px;border-radius:7px;text-decoration:none;font-size:13px;margin-top:16px;">View Tasks</a>
</div>
`;

module.exports = { sendEmail, taskAssignedEmail, overdueTaskEmail };
