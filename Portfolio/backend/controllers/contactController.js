import nodemailer from 'nodemailer';
import axios from 'axios';

// ── Nodemailer transporter (Gmail + App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASSWORD,
  },
});

// ── Send email notification to your Gmail
const sendEmail = ({ name, email, subject, message }) => {
  const subjectLabels = {
    internship: 'Internship Opportunity',
    job: 'Job Opportunity',
    freelance: 'Freelance Project',
    collaboration: 'Collaboration',
    other: 'Other',
  };

  return transporter.sendMail({
    from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `[Portfolio] ${subjectLabels[subject] || subject} — from ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="background:#0f172a;padding:24px;text-align:center;">
          <h2 style="color:#a78bfa;margin:0;">New Portfolio Contact</h2>
        </div>
        <div style="padding:24px;background:#1e293b;color:#e2e8f0;">
          <p><strong style="color:#a78bfa;">Name:</strong> ${name}</p>
          <p><strong style="color:#a78bfa;">Email:</strong> <a href="mailto:${email}" style="color:#38bdf8;">${email}</a></p>
          <p><strong style="color:#a78bfa;">Subject:</strong> ${subjectLabels[subject] || subject}</p>
          <hr style="border-color:#334155;margin:16px 0;">
          <p><strong style="color:#a78bfa;">Message:</strong></p>
          <p style="white-space:pre-wrap;background:#0f172a;padding:16px;border-radius:6px;">${message}</p>
        </div>
        <div style="padding:12px 24px;background:#0f172a;text-align:center;">
          <small style="color:#64748b;">Sent from atharvadhawane.dev contact form</small>
        </div>
      </div>
    `,
  });
};

// ── Send SMS via Fast2SMS
const sendSMS = ({ name, subject, message }) => {
  const smsText = `Portfolio contact from ${name} | Subject: ${subject} | "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`;

  return axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
      route: 'q',                            // transactional / quick route
      message: smsText,
      language: 'english',
      flash: 0,
      numbers: process.env.PHONE_NUMBER,     // your 10-digit mobile number
    },
    {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
};

// ── Main controller
export const handleContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // Run email and SMS in parallel — don't let SMS failure block email
    const results = await Promise.allSettled([
      sendEmail({ name, email, subject, message }),
      sendSMS({ name, subject, message }),
    ]);

    const emailResult = results[0];
    const smsResult   = results[1];

    if (emailResult.status === 'rejected') {
      console.error('[Email Error]', emailResult.reason?.message);
      // Email is critical — surface error to user
      return res.status(500).json({ success: false, message: 'Failed to send message. Please try again or email me directly.' });
    }

    if (smsResult.status === 'rejected') {
      // SMS failure is non-critical — log it but still return success
      console.warn('[SMS Warning]', smsResult.reason?.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully! I\'ll reply within 24 hours.',
    });

  } catch (err) {
    console.error('[Contact Controller Error]', err.message);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};
