// testMail.js
require('dotenv').config(); // dotenv को लोड करें
const nodemailer = require('nodemailer');

async function testMail() {
  // transporter का सेटअप Gmail SMTP के साथ
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // आपकी ईमेल आईडी
      pass: process.env.EMAIL_PASS  // आपका App Password या Gmail Password
    }
  });

  // मेल का ऑप्शन्स सेट करें
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER, // फ्रोम
    to: process.env.EMAIL_USER, // अपने आप को ही भेजें टेस्ट के लिए
    subject: 'Test Email',
    text: 'यह एक टेस्ट ईमेल है node.js से'
  };

  // मेल भेजने का प्रयास
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('मेल भेजा गया:', info.response);
  } catch (error) {
    console.error('मिलने वाली त्रुटि:', error);
  }
}

testMail();
