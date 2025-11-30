const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const axios = require("axios");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../../models/student/User");

const router = express.Router();
const STUDENT_JWT_SECRET = process.env.STUDENT_JWT_SECRET || "default_student_secret";

// Simple in-memory rate limiter per IP for registration attempts (avoid external deps)
const registerAttempts = new Map(); // ip -> { count, firstTs }
const RATE_LIMIT_MAX = parseInt(process.env.REGISTER_RATE_LIMIT_MAX || "5", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS || "15") * 60 * 1000; // minutes -> ms

function isRateLimited(ip) {
  const now = Date.now();
  const entry = registerAttempts.get(ip) || { count: 0, firstTs: now };
  if (now - entry.firstTs > RATE_LIMIT_WINDOW_MS) {
    // reset window
    entry.count = 0;
    entry.firstTs = now;
  }
  entry.count += 1;
  registerAttempts.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

// basic sanitize to strip angle brackets and trim
function sanitizeStr(v) {
  if (v === undefined || v === null) return v;
  return String(v).replace(/[<>]/g, "").trim();
}

async function verifyRecaptcha(token, ip) {
  return true; // Always bypass for local testing
}

// nodemailer transporter - prefer SMTP auth (EMAIL_USER/EMAIL_PASS) for App Passwords,
// otherwise fall back to Gmail OAuth2 when OAuth creds are available.
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: (process.env.EMAIL_SECURE || 'true') === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
      logger: true ,  
      debug: true    
  });
} else if (process.env.EMAIL_OAUTH_CLIENT_ID && process.env.EMAIL_OAUTH_CLIENT_SECRET && process.env.EMAIL_OAUTH_REFRESH_TOKEN) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_FROM,
      clientId: process.env.EMAIL_OAUTH_CLIENT_ID,
      clientSecret: process.env.EMAIL_OAUTH_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_OAUTH_REFRESH_TOKEN,
      accessToken: undefined // nodemailer will fetch automatically
    }
  });
} else {
  // Fallback: no mailer configured — create a dummy transporter that logs
  transporter = {
    sendMail: async (mail) => {
      console.warn('No email configuration provided. Mail would be:', mail);
      return Promise.resolve({ accepted: [], rejected: [], info: 'no-mail-config' });
    }
  };
}

async function sendVerificationEmail(user, token) {
  try {
    const backend = process.env.BACKEND_URL || "http://localhost:5000";
    // FIXED: Backend verification URL banaya hai jo directly backend route pe hit karega
    const verifyUrl = `${backend}/student/auth/verify?token=${token}`;
    console.log('Sending verification email with URL:', verifyUrl); // For debugging
    const mail = {
      from: `"Softpro9 Academy" <${process.env.EMAIL_FROM}>`,
      to: user.email || user.username,
      subject: 'Verify Your Softpro9 Academy Account',
      text: `
Hello ${user.username},

Welcome to Softpro9 Academy! Please verify your email address to complete your registration.

Click the following link to verify your account:
${verifyUrl}

This verification link will expire in 1 hour for security purposes.

If you didn't create an account with Softpro9 Academy, please ignore this email.

Best regards,
The Softpro9 Academy Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Verify Your Softpro9 Academy Account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5; padding: 20px; margin: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: #ffffff; border-radius: 50%; display: inline-block; line-height: 80px; font-size: 48px;">
          ✉️
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Softpro9 Academy</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #2563eb; text-align: center; margin: 0 0 30px 0; font-size: 24px;">Verify Your Email Address</h2>
        
        <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px;">Hello <strong>${user.username}</strong>,</p>
        
        <p style="margin: 0 0 20px 0; color: #555555; font-size: 15px; line-height: 1.6;">Welcome to Softpro9 Academy! We're excited to have you on board. Please verify your email address to complete your registration and unlock full access to our platform.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="${verifyUrl}" style="background: #2563eb; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">✓ Verify Email Address</a>
            </td>
          </tr>
        </table>
        
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 25px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: bold;">🔗 Can't click the button?</p>
          <p style="margin: 0 0 5px 0; color: #666666; font-size: 13px;">Copy and paste this link in your browser:</p>
          <p style="margin: 0; color: #2563eb; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
        </div>
        
        <p style="margin: 20px 0 0 0; color: #666666; font-size: 13px; line-height: 1.5;">
          ⏱️ This verification link will expire in <strong>1 hour</strong> for security purposes.
        </p>
        
        <p style="margin: 20px 0 0 0; color: #999999; font-size: 13px; font-style: italic;">
          💡 If you didn't create an account with Softpro9 Academy, please ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background: #f8fafc; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px;">© 2025 Softpro9 Academy. All rights reserved.</p>
        <p style="margin: 0; color: #999999; font-size: 11px;">📍 H.O.: Gomti Nagar, Lucknow, Uttar Pradesh 226010</p>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };
    const result = await transporter.sendMail(mail);
    console.log('Verification email sent:', { to: mail.to, messageId: result?.messageId });
    return { success: true, messageId: result?.messageId };
  } catch (err) {
    console.error('sendVerificationEmail error', err?.message);
    return { success: false, error: err?.message };
  }
}

/***********************
 *  PASSPORT CONFIG
 ***********************/
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "dummy_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy_client_secret",
      callbackURL: "/student/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: profile.emails?.[0]?.value || null,
            googleId: profile.id,
            password: null
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

router.use(passport.initialize());

/***********************
 *  REGISTER
 ***********************/
router.post("/register", async (req, res) => {
  const { username, email, mobile, password, recaptchaToken } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || req.ip;

  try {
    // Rate limiting per IP
    if (isRateLimited(ip)) return res.status(429).json({ message: 'Too many registration attempts. Try again later.' });

    // Verify recaptcha
    const recaptchaOk = await verifyRecaptcha(recaptchaToken, ip);
    if (!recaptchaOk) return res.status(400).json({ message: 'recaptcha verification failed' });

    // Basic sanitization
    const sUsername = sanitizeStr(username);
    const sEmail = sanitizeStr(email);
    const sMobile = sanitizeStr(mobile);

    const existing = await User.findOne({ where: { email: sEmail } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    // create verification token
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour

    const user = await User.create({ username: sUsername, email: sEmail, mobile: sMobile, password: hash, verificationToken: token, verificationExpires: expires, isVerified: false });

    // send verification email and track result
    const emailResult = await sendVerificationEmail(user, token);
    
    // Return status that includes email sending result
    res.json({ 
      message: emailResult.success 
        ? "Registration successful. Please check your email to verify your account." 
        : "Registration successful but there was a problem sending the verification email. Please use the resend verification option to try again.",
      user: { id: user.id, email: user.email },
      emailStatus: emailResult.success ? 'sent' : 'failed',
      emailError: emailResult.error
    });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

/***********************
 *  LOGIN
 ***********************/
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // ensure verified
    if (!user.isVerified) return res.status(403).json({ message: 'Account not verified. Please check your email.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, STUDENT_JWT_SECRET, { expiresIn: "1d" });

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

/**
 * Resend verification email
 * POST /student/auth/resend-verification
 * body: { email }
 */
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || req.ip;
  try {
    if (isRateLimited(ip)) return res.status(429).json({ message: 'Too many attempts. Try again later.' });

    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    // create new verification token
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour
    user.verificationToken = token;
    user.verificationExpires = expires;
    await user.save();

    // send email (async)
    sendVerificationEmail(user, token).catch(err => console.error('resend sendVerificationEmail error', err?.message));

    res.json({ message: 'Verification email resent. Please check your inbox.' });
  } catch (err) {
    console.error('resend-verification error', err);
    res.status(500).json({ message: 'Failed to resend verification', error: err.message });
  }
});

// Verify email token endpoint
router.get('/verify', async (req, res) => {
  const { token } = req.query;
  // CHANGE THIS TO YOUR ACTUAL FRONTEND URL
  const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
  
  if (!token) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Failed</title>
        <script>
          setTimeout(() => {
            window.location.href = '${frontend}/?verified=error&message=Token required';
          }, 2000);
        </script>
      </head>
      <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; max-width: 400px;">
          <svg style="width: 60px; height: 60px; margin: 0 auto 20px;" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#ef4444"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <h2 style="color: #ef4444; margin: 0 0 10px 0;">Verification Failed</h2>
          <p style="color: #666; margin: 0 0 20px 0;">Token is missing</p>
          <p style="color: #999; font-size: 14px;">Redirecting to homepage...</p>
        </div>
      </body>
      </html>
    `);
  }
  
  try {
    const user = await User.findOne({ where: { verificationToken: token } });
    
    if (!user) {
      // Check if user with this email exists and is already verified
      const verifiedUser = await User.findOne({ where: { isVerified: true } });
      
      if (verifiedUser) {
        // User is already verified
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Already Verified</title>
            <script>
              setTimeout(() => {
                window.location.href = '${frontend}/?verified=success&message=Your account is already verified. You can login now.';
              }, 2000);
            </script>
          </head>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; max-width: 400px; animation: slideIn 0.5s ease-out;">
              <svg style="width: 60px; height: 60px; margin: 0 auto 20px; animation: checkmark 0.6s ease-in-out;" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#10b981"/>
                <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <h2 style="color: #10b981; margin: 0 0 10px 0;">Already Verified!</h2>
              <p style="color: #666; margin: 0 0 20px 0;">Your account is already verified. You can login now.</p>
              <p style="color: #999; font-size: 14px;">Redirecting to homepage...</p>
            </div>
            <style>
              @keyframes slideIn {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes checkmark {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
              }
            </style>
          </body>
          </html>
        `);
      }
      
      // Token invalid
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed</title>
          <script>
            setTimeout(() => {
              window.location.href = '${frontend}/?verified=error&message=Invalid verification link. Please request a new one.';
            }, 2000);
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; max-width: 400px;">
            <svg style="width: 60px; height: 60px; margin: 0 auto 20px;" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#ef4444"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h2 style="color: #ef4444; margin: 0 0 10px 0;">Verification Failed</h2>
            <p style="color: #666; margin: 0 0 20px 0;">Invalid verification link. Please request a new one.</p>
            <p style="color: #999; font-size: 14px;">Redirecting to homepage...</p>
          </div>
        </body>
        </html>
      `);
    }
    
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Expired</title>
          <script>
            setTimeout(() => {
              window.location.href = '${frontend}/?verified=expired&message=Verification link has expired. Please request a new one.';
            }, 2000);
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; max-width: 400px;">
            <svg style="width: 60px; height: 60px; margin: 0 auto 20px;" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#f59e0b"/>
              <path d="M12 8v4m0 4h.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h2 style="color: #f59e0b; margin: 0 0 10px 0;">Link Expired</h2>
            <p style="color: #666; margin: 0 0 20px 0;">This verification link has expired</p>
            <p style="color: #999; font-size: 14px;">Redirecting to homepage...</p>
          </div>
        </body>
        </html>
      `);
    }

    // Verification successful
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Successful</title>
        <script>
          setTimeout(() => {
            window.location.href = '${frontend}/?verified=success&message=Account verified successfully! You can now login.';
          }, 2000);
        </script>
      </head>
      <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; max-width: 400px; animation: slideIn 0.5s ease-out;">
          <svg style="width: 60px; height: 60px; margin: 0 auto 20px; animation: checkmark 0.6s ease-in-out;" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#10b981"/>
            <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h2 style="color: #10b981; margin: 0 0 10px 0;">Verification Successful!</h2>
          <p style="color: #666; margin: 0 0 20px 0;">Your account has been verified successfully</p>
          <p style="color: #999; font-size: 14px;">Redirecting to homepage...</p>
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes checkmark {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        </style>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Verification error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Failed</title>
        <script>
          setTimeout(() => {
            window.location.href = '${frontend}/?verified=error&message=Verification failed. Please try again.';
          }, 2000);
        </script>
      </head>
      <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; max-width: 400px;">
          <svg style="width: 60px; height: 60px; margin: 0 auto 20px;" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#ef4444"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <h2 style="color: #ef4444; margin: 0 0 10px 0;">Verification Failed</h2>
          <p style="color: #666; margin: 0 0 20px 0;">Something went wrong. Please try again.</p>
          <p style="color: #999; font-size: 14px;">Redirecting to homepage...</p>
        </div>
      </body>
      </html>
    `);
  }
});

/***********************
 *  GOOGLE OAUTH
 ***********************/
router.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"], 
  session: false 
}));

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "http://localhost:3000/?error=oauth_failed", 
    session: false 
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id, email: req.user.email }, STUDENT_JWT_SECRET, { expiresIn: "1d" });
    res.redirect(`http://localhost:3000/auth-callback?token=${token}`);
  }
);

/***********************
 *  VERIFY TOKEN / PROFILE ROUTE (optional)
 ***********************/
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Token required" });
  try {
    req.user = jwt.verify(token, STUDENT_JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

module.exports = router;