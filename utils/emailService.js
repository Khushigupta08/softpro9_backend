const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send confirmation email to user (for consultation form)
const sendConfirmationEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: `"SoftPro9" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Thank You for Reaching Out - SoftPro9 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .header h1 { margin: 0; font-size: 28px; }
          .content { 
            background: #ffffff; 
            padding: 40px 30px; 
            border-left: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }
          .highlight-box {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .highlight-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .highlight-box li {
            margin: 8px 0;
          }
          .button { 
            display: inline-block; 
            padding: 14px 35px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 25px 0;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
          .footer { 
            background: #f8f9fa;
            text-align: center; 
            padding: 25px; 
            color: #666; 
            font-size: 13px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
          }
          .emoji { font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Reaching Out! 🎉</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Dear <strong>${userName}</strong>,</p>
            
            <p>Thank you for your interest in <strong>SoftPro9's</strong> services. We have successfully received your consultation request and are excited to work with you!</p>
            
            <div class="highlight-box">
              <p style="margin-top: 0; font-weight: bold; color: #667eea;">📋 What happens next?</p>
              <ul>
                <li><span class="emoji">✅</span> Our team will carefully review your requirements</li>
                <li><span class="emoji">📞</span> We will contact you within <strong>24 hours</strong></li>
                <li><span class="emoji">💡</span> We'll discuss the best solutions tailored for your needs</li>
                <li><span class="emoji">🚀</span> Get ready to transform your business!</li>
              </ul>
            </div>
            
            <p>In the meantime, feel free to explore our services or reach out if you have any questions.</p>
            
            <center>
              <a href="https://yourwebsite.com" class="button">Visit Our Website</a>
            </center>
            
            <p style="margin-top: 30px;">Best regards,<br>
            <strong>The SoftPro9 Team</strong><br>
            <span style="color: #667eea;">Transforming Ideas into Reality</span></p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;"><strong>© 2024 SoftPro9. All rights reserved.</strong></p>
            <p style="margin: 5px 0;">📧 support@softpro9.com | 📱 +91-9535451414</p>
            <p style="margin: 15px 0 5px 0; color: #999; font-size: 12px;">If you didn't request this consultation, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    throw error;
  }
};

// Send notification email to admin (for consultation form)
const sendAdminNotification = async (consultationData) => {
  const mailOptions = {
    from: `"SoftPro9 System" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL, // ✅ FIXED: Changed from EMAIL_FROM to ADMIN_EMAIL
    subject: '🔔 New Consultation Request Received',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 650px; margin: 0 auto; background: #f5f5f5; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 25px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { background: white; padding: 0; border-radius: 0 0 10px 10px; overflow: hidden; }
          .info-row { 
            padding: 15px 25px; 
            border-bottom: 1px solid #e8e8e8;
            display: flex;
            align-items: flex-start;
          }
          .info-row:last-child { border-bottom: none; }
          .label { 
            font-weight: bold; 
            color: #667eea; 
            min-width: 180px;
            display: inline-block;
          }
          .value { color: #333; flex: 1; }
          .priority { 
            background: #ff6b6b; 
            color: white; 
            padding: 5px 15px; 
            border-radius: 15px; 
            display: inline-block;
            font-size: 12px;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 25px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🔔 New Consultation Request</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>
          <div class="content">
            <div class="info-row">
              <span class="label">👤 Full Name:</span>
              <span class="value"><strong>${consultationData.fullName}</strong></span>
            </div>
            <div class="info-row">
              <span class="label">📧 Email:</span>
              <span class="value"><a href="mailto:${consultationData.email}">${consultationData.email}</a></span>
            </div>
            <div class="info-row">
              <span class="label">📱 Phone:</span>
              <span class="value"><a href="tel:${consultationData.countryCode}${consultationData.phone}">${consultationData.countryCode} ${consultationData.phone}</a></span>
            </div>
            <div class="info-row">
              <span class="label">🎯 Service Interest:</span>
              <span class="value">${consultationData.serviceInterest}${consultationData.otherService ? ` - ${consultationData.otherService}` : ''}</span>
            </div>
            <div class="info-row">
              <span class="label">🏢 Company:</span>
              <span class="value">${consultationData.companyName || 'Not provided'}</span>
            </div>
            <div class="info-row">
              <span class="label">🌐 Website:</span>
              <span class="value">${consultationData.website ? `<a href="${consultationData.website}" target="_blank">${consultationData.website}</a>` : 'Not provided'}</span>
            </div>
            <div class="info-row">
              <span class="label">💼 Role/Designation:</span>
              <span class="value">${consultationData.roleDesignation || 'Not provided'}</span>
            </div>
            <div class="info-row">
              <span class="label">📍 Location:</span>
              <span class="value">${consultationData.cityCountry}</span>
            </div>
            <div class="info-row">
              <span class="label">🎯 Looking For:</span>
              <span class="value">${consultationData.reason}</span>
            </div>
            <div class="info-row">
              <span class="label">💬 Consultation Mode:</span>
              <span class="value">${consultationData.consultationMode}</span>
            </div>
            ${consultationData.preferredDateTime ? `
            <div class="info-row">
              <span class="label">📅 Preferred Date/Time:</span>
              <span class="value">${new Date(consultationData.preferredDateTime).toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">📣 Heard About Us:</span>
              <span class="value">${consultationData.hearAboutUs || 'Not specified'}</span>
            </div>
            <div class="info-row" style="background: #f8f9ff;">
              <span class="label">📝 Requirements:</span>
              <span class="value" style="white-space: pre-wrap;">${consultationData.requirementDescription}</span>
            </div>
            <div style="padding: 20px 25px; text-align: center; background: #f8f9fa;">
              <a href="http://localhost:3000/admin/consultations" class="button">View in Admin Panel →</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    throw error;
  }
};

// Send confirmation email to contact form user
const sendContactConfirmationEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: `"SoftPro9" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Thank You for Contacting Us - SoftPro9 💬',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .header h1 { margin: 0; font-size: 28px; }
          .content { 
            background: #ffffff; 
            padding: 40px 30px; 
            border-left: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }
          .highlight-box {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .highlight-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .highlight-box li {
            margin: 8px 0;
          }
          .button { 
            display: inline-block; 
            padding: 14px 35px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 25px 0;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
          .footer { 
            background: #f8f9fa;
            text-align: center; 
            padding: 25px; 
            color: #666; 
            font-size: 13px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
          }
          .emoji { font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Contacting Us! 💬</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Dear <strong>${userName}</strong>,</p>
            
            <p>Thank you for reaching out to <strong>SoftPro9</strong>. We have received your message and appreciate you taking the time to contact us!</p>
            
            <div class="highlight-box">
              <p style="margin-top: 0; font-weight: bold; color: #667eea;">📋 What's Next?</p>
              <ul>
                <li><span class="emoji">✅</span> Our team is reviewing your message</li>
                <li><span class="emoji">📞</span> We will respond to you within <strong>24 hours</strong></li>
                <li><span class="emoji">💡</span> We're here to help with any questions you have</li>
                <li><span class="emoji">🚀</span> Looking forward to assisting you!</li>
              </ul>
            </div>
            
            <p>If your inquiry is urgent, feel free to call us directly at <strong>+91-9535451414</strong></p>
            
            <center>
              <a href="https://yourwebsite.com" class="button">Visit Our Website</a>
            </center>
            
            <p style="margin-top: 30px;">Best regards,<br>
            <strong>The SoftPro9 Team</strong><br>
            <span style="color: #667eea;">Your Success is Our Mission</span></p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;"><strong>© 2024 SoftPro9. All rights reserved.</strong></p>
            <p style="margin: 5px 0;">📧 support@softpro9.com | 📱 +91-9535451414</p>
            <p style="margin: 15px 0 5px 0; color: #999; font-size: 12px;">This is an automated response. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Contact confirmation email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending contact confirmation email:', error);
    throw error;
  }
};

// Send notification email to admin for contact form
const sendContactAdminNotification = async (contactData) => {
  const mailOptions = {
    from: `"SoftPro9 System" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL, // ✅ FIXED: Changed from EMAIL_FROM to ADMIN_EMAIL
    subject: '📬 New Contact Form Message Received',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 650px; margin: 0 auto; background: #f5f5f5; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 25px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { background: white; padding: 0; border-radius: 0 0 10px 10px; overflow: hidden; }
          .info-row { 
            padding: 15px 25px; 
            border-bottom: 1px solid #e8e8e8;
            display: flex;
            align-items: flex-start;
          }
          .info-row:last-child { border-bottom: none; }
          .label { 
            font-weight: bold; 
            color: #667eea; 
            min-width: 150px;
            display: inline-block;
          }
          .value { color: #333; flex: 1; }
          .message-box {
            background: #f8f9ff;
            padding: 20px;
            margin: 15px 25px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 25px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">📬 New Contact Form Message</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>
          <div class="content">
            <div class="info-row">
              <span class="label">👤 Name:</span>
              <span class="value"><strong>${contactData.name}</strong></span>
            </div>
            <div class="info-row">
              <span class="label">📧 Email:</span>
              <span class="value"><a href="mailto:${contactData.email}">${contactData.email}</a></span>
            </div>
            <div class="info-row">
              <span class="label">📱 Phone:</span>
              <span class="value">${contactData.phone ? `<a href="tel:${contactData.phone}">${contactData.phone}</a>` : 'Not provided'}</span>
            </div>
            <div class="info-row">
              <span class="label">🎯 Service:</span>
              <span class="value">${contactData.service || 'Not specified'}</span>
            </div>
            ${contactData.ip ? `
            <div class="info-row">
              <span class="label">🌐 IP Address:</span>
              <span class="value">${contactData.ip}</span>
            </div>
            ` : ''}
            <div class="message-box">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #667eea;">💬 Message:</p>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.8;">${contactData.message}</p>
            </div>
            <div style="padding: 20px 25px; text-align: center; background: #f8f9fa;">
              <a href="http://localhost:3000/admin/messages" class="button">View in Admin Panel →</a>
              <br><br>
              <a href="mailto:${contactData.email}" style="color: #667eea; text-decoration: none; font-weight: bold;">📧 Reply to ${contactData.name}</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Contact admin notification sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending contact admin notification:', error);
    throw error;
  }
};
// =====================
// Expert Request Emails
// =====================

// User ko expert consultation confirmation email
const sendExpertUserEmail = async (userEmail, userName, expertDateTime) => {
  const formattedDateTime = expertDateTime
    ? new Date(expertDateTime).toLocaleString('en-IN')
    : 'Our team will coordinate the best time with you.';

  const mailOptions = {
    from: `"SoftPro9" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Your Expert Consultation Request - SoftPro9 ✅',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .content { 
            background: #ffffff; 
            padding: 40px 30px; 
            border-left: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }
          .highlight-box {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer { 
            background: #f8f9fa;
            text-align: center; 
            padding: 25px; 
            color: #666; 
            font-size: 13px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Expert Consultation Request Received 🎓</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Dear <strong>${userName}</strong>,</p>
            <p>Thank you for requesting an expert consultation with <strong>SoftPro9</strong>. Your request has been received successfully.</p>
            
            <div class="highlight-box">
              <p style="margin-top: 0; font-weight: bold; color: #667eea;">📅 Preferred Date & Time</p>
              <p style="margin: 0;">${formattedDateTime}</p>
            </div>

            <p>Our team will review your request and get back to you within <strong>24 hours</strong> with the next steps.</p>
            <p style="margin-top: 30px;">Best regards,<br>
            <strong>The SoftPro9 Team</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;"><strong>© 2024 SoftPro9. All rights reserved.</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Expert user email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending expert user email:', error);
    throw error;
  }
};


// Admin ko expert consultation notification email
const sendExpertAdminNotification = async (expertData) => {
  const mailOptions = {
    from: `"SoftPro9 System" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: '🧠 New Expert Consultation Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 650px; margin: 0 auto; background: #f5f5f5; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 25px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { background: white; padding: 0; border-radius: 0 0 10px 10px; overflow: hidden; }
          .info-row { 
            padding: 15px 25px; 
            border-bottom: 1px solid #e8e8e8;
            display: flex;
            align-items: flex-start;
          }
          .info-row:last-child { border-bottom: none; }
          .label { 
            font-weight: bold; 
            color: #667eea; 
            min-width: 180px;
            display: inline-block;
          }
          .value { color: #333; flex: 1; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🧠 New Expert Consultation Request</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>
          <div class="content">
            <div class="info-row">
              <span class="label">👤 Name:</span>
              <span class="value"><strong>${expertData.name}</strong></span>
            </div>
            <div class="info-row">
              <span class="label">📧 Email:</span>
              <span class="value"><a href="mailto:${expertData.email}">${expertData.email}</a></span>
            </div>
            <div class="info-row">
              <span class="label">📱 Phone:</span>
              <span class="value">${expertData.phone}</span>
            </div>
            <div class="info-row">
              <span class="label">📅 Preferred Date/Time:</span>
              <span class="value">${expertData.expertDateTime ? new Date(expertData.expertDateTime).toLocaleString('en-IN') : 'Not provided'}</span>
            </div>
            <div class="info-row">
              <span class="label">📝 Message:</span>
              <span class="value" style="white-space: pre-wrap;">${expertData.message || 'No message'}</span>
            </div>
            ${expertData.ip ? `
            <div class="info-row">
              <span class="label">🌐 IP Address:</span>
              <span class="value">${expertData.ip}</span>
            </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Expert admin notification sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending expert admin notification:', error);
    throw error;
  }
};

// =====================
// Franchise Application Emails
// =====================

// Send confirmation email to franchise applicant
const sendFranchiseConfirmationEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: `"SoftPro9" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Thank You for Your Franchise Application - SoftPro9 🤝',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .header h1 { margin: 0; font-size: 28px; }
          .content { 
            background: #ffffff; 
            padding: 40px 30px; 
            border-left: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }
          .highlight-box {
            background: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .highlight-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .highlight-box li {
            margin: 8px 0;
          }
          .button { 
            display: inline-block; 
            padding: 14px 35px; 
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white !important; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 25px 0;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
          }
          .footer { 
            background: #f8f9fa;
            text-align: center; 
            padding: 25px; 
            color: #666; 
            font-size: 13px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
          }
          .emoji { font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Franchise Application! 🤝</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Dear <strong>${userName}</strong>,</p>
            
            <p>Thank you for your interest in becoming a <strong>SoftPro9 Franchise Partner</strong>! We are excited to receive your application and appreciate your trust in our brand.</p>
            
            <div class="highlight-box">
              <p style="margin-top: 0; font-weight: bold; color: #2563eb;">📋 Next Steps:</p>
              <ul>
                <li><span class="emoji">✅</span> Our franchise team is reviewing your application</li>
                <li><span class="emoji">📞</span> We will contact you within <strong>48 hours</strong></li>
                <li><span class="emoji">💼</span> We'll discuss franchise opportunities in your city</li>
                <li><span class="emoji">📊</span> You'll receive detailed business information</li>
                <li><span class="emoji">🚀</span> Together, we'll build a successful education business!</li>
              </ul>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚡ Why SoftPro9?</strong><br>
                Join India's fastest-growing career training network with proven systems, comprehensive support, and high ROI potential.
              </p>
            </div>
            
            <p>Meanwhile, feel free to explore our website or contact us if you have any questions:</p>
            <p style="margin: 10px 0;">
              📞 <strong>Phone:</strong> +91 9535451414<br>
              📧 <strong>Email:</strong> franchise@softpro9.com<br>
              🌐 <strong>Website:</strong> https://softpro9.com
            </p>
            
            <center>
              <a href="https://softpro9.com" class="button">Visit Our Website</a>
            </center>
            
            <p style="margin-top: 30px;">Best regards,<br>
            <strong>SoftPro9 Franchise Team</strong><br>
            <span style="color: #2563eb;">Building Careers, Building Futures</span></p>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;"><strong>© 2024 SoftPro9. All rights reserved.</strong></p>
            <p style="margin: 5px 0;">📧 franchise@softpro9.com | 📱 +91-9535451414</p>
            <p style="margin: 15px 0 5px 0; color: #999; font-size: 12px;">This is an automated confirmation. We'll be in touch soon!</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Franchise confirmation email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending franchise confirmation email:', error);
    throw error;
  }
};

// Send notification email to admin about new franchise application
const sendFranchiseAdminNotification = async (franchiseData) => {
  const mailOptions = {
    from: `"SoftPro9 System" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: '🏢 New Franchise Application Received',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 650px; margin: 0 auto; background: #f5f5f5; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
            color: white; 
            padding: 25px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
          }
          .content { background: white; padding: 0; border-radius: 0 0 10px 10px; overflow: hidden; }
          .info-row { 
            padding: 15px 25px; 
            border-bottom: 1px solid #e8e8e8;
            display: flex;
            align-items: flex-start;
          }
          .info-row:last-child { border-bottom: none; }
          .label { 
            font-weight: bold; 
            color: #2563eb; 
            min-width: 150px;
            display: inline-block;
          }
          .value { color: #333; flex: 1; }
          .priority { 
            background: #10b981; 
            color: white; 
            padding: 5px 15px; 
            border-radius: 15px; 
            display: inline-block;
            font-size: 12px;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #2563eb;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 25px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🏢 New Franchise Application</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
            <div style="margin-top: 15px;">
              <span class="priority">HIGH PRIORITY</span>
            </div>
          </div>
          <div class="content">
            <div class="info-row">
              <span class="label">👤 Full Name:</span>
              <span class="value"><strong>${franchiseData.name}</strong></span>
            </div>
            <div class="info-row">
              <span class="label">📧 Email:</span>
              <span class="value"><a href="mailto:${franchiseData.email}">${franchiseData.email}</a></span>
            </div>
            <div class="info-row">
              <span class="label">📱 Mobile:</span>
              <span class="value"><a href="tel:${franchiseData.mobile}">${franchiseData.mobile}</a></span>
            </div>
            <div class="info-row">
              <span class="label">📍 City/Location:</span>
              <span class="value"><strong>${franchiseData.city}</strong></span>
            </div>
            <div class="info-row">
              <span class="label">💼 Interested:</span>
              <span class="value">${franchiseData.interested === 'yes' ? '✅ Yes - Highly Interested' : '❓ Exploring Options'}</span>
            </div>
            ${franchiseData.ip ? `
            <div class="info-row">
              <span class="label">🌐 IP Address:</span>
              <span class="value">${franchiseData.ip}</span>
            </div>
            ` : ''}
            <div style="padding: 20px 25px; text-align: center; background: #eff6ff;">
              <p style="margin: 0 0 15px 0; color: #1e40af; font-weight: bold;">⚡ Action Required: Contact this applicant within 48 hours!</p>
              <a href="http://localhost:3000/admin/franchises" class="button">View in Admin Panel →</a>
              <br><br>
              <div style="margin-top: 15px;">
                <a href="tel:${franchiseData.mobile}" style="color: #2563eb; text-decoration: none; font-weight: bold; margin: 0 15px;">📞 Call Now</a>
                <a href="mailto:${franchiseData.email}" style="color: #2563eb; text-decoration: none; font-weight: bold; margin: 0 15px;">📧 Send Email</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Franchise admin notification sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending franchise admin notification:', error);
    throw error;
  }
};


module.exports = {
  sendConfirmationEmail,
  sendAdminNotification,
  sendContactConfirmationEmail,      
  sendContactAdminNotification ,
  sendExpertAdminNotification,  
  sendExpertUserEmail ,
  sendFranchiseConfirmationEmail,
  sendFranchiseAdminNotification   
};