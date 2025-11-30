require('dotenv').config();
const nodemailer = require('nodemailer');

async function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465', 10),
      secure: (process.env.EMAIL_SECURE || 'true') === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  if (process.env.EMAIL_OAUTH_CLIENT_ID && process.env.EMAIL_OAUTH_CLIENT_SECRET && process.env.EMAIL_OAUTH_REFRESH_TOKEN) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_FROM,
        clientId: process.env.EMAIL_OAUTH_CLIENT_ID,
        clientSecret: process.env.EMAIL_OAUTH_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_OAUTH_REFRESH_TOKEN,
        accessToken: undefined
      }
    });
  }

  // fallback: dummy transporter
  return {
    sendMail: async (mail) => {
      console.warn('No email configuration provided. Mail would be:', mail);
      return Promise.resolve({ accepted: [], rejected: [], info: 'no-mail-config' });
    }
  };
}

async function run() {
  const transporter = await createTransporter();

  const mail = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_FROM,
    subject: 'Test email from Softpro9 backend',
    text: 'This is a test email to verify nodemailer OAuth2 configuration.'
  };

  try {
    const info = await transporter.sendMail(mail);
    console.log('Email sent successfully:', info);
  } catch (err) {
    console.error('Test send error:', err);
  }
}

run().catch(err => console.error(err));
