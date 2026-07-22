import nodemailer from 'nodemailer';

let transporter = null;

export async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('SMTP transporter initialized');
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('--- Ethereal Email (dev mode) ---');
    console.log(`Login at https://ethereal.email`);
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
    console.log('---------------------------------');
  }

  return transporter;
}

export async function sendResetEmail(toEmail, resetLink) {
  const t = await getTransporter();

  const info = await t.sendMail({
    from: '"Social Skills Game" <noreply@socialskillsgame.com>',
    to: toEmail,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
        <h2 style="color:#2c3e50;margin-top:0;">Reset Your Password</h2>
        <p style="color:#555;line-height:1.6;">You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 28px;background:#f5d77c;color:#333;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">Reset Password</a>
        <p style="color:#999;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #ddd;">
        <p style="color:#999;font-size:12px;">Social Skills Game</p>
      </div>
    `,
  });

  if (process.env.SMTP_HOST) {
    console.log(`Reset email sent to ${toEmail}: ${info.messageId}`);
  } else {
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
}
