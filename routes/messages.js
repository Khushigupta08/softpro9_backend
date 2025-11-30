const express = require('express');
const rateLimit = require('express-rate-limit');
const { Op } = require('sequelize'); // ⭐ CRITICAL: Must have this
const router = express.Router();
const Message = require('../models/Message');
const { sendContactConfirmationEmail, sendContactAdminNotification } = require('../utils/emailService');


// Contact form rate limiter - 5 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { 
    success: false, 
    error: 'Too many contact form submissions. Please try again after 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    console.log(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again after 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// List messages rate limiter - 20 requests per minute
const listLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: { 
    success: false, 
    error: 'Too many requests. Please slow down.' 
  }
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  // Check if token exists and matches
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized access. Admin authentication required.' 
    });
  }
  
  next();
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get client IP address
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

// Sanitize string input
function sanitizeStr(value) {
  if (value === undefined || value === null) return value;
  return String(value)
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 10000); // Prevent extremely long strings
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone format (optional field)
function isValidPhone(phone) {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[0-9+\-() ]{7,20}$/;
  return phoneRegex.test(phone);
}

// ============================================
// ROUTES
// ============================================

// POST - Create new message (with rate limiting)
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;
    const ip = getClientIp(req);

    console.log(`📝 New contact form submission from IP: ${ip}`);

    // ===== VALIDATION =====
    
    // Required fields check
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and message are required fields' 
      });
    }

    // Sanitize inputs
    const sName = sanitizeStr(name);
    const sEmail = sanitizeStr(email);
    const sPhone = sanitizeStr(phone);
    const sService = sanitizeStr(service);
    const sMessage = sanitizeStr(message);

    // Length validations
    if (sName.length < 2 || sName.length > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name must be between 2 and 100 characters' 
      });
    }

    if (sMessage.length < 10 || sMessage.length > 5000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message must be between 10 and 5000 characters' 
      });
    }

    // Email format validation
    if (!isValidEmail(sEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a valid email address' 
      });
    }

    // Phone format validation (if provided)
    if (sPhone && !isValidPhone(sPhone)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a valid phone number' 
      });
    }

    // Service validation
    const validServices = ['SAP', 'Web & App Development', 'Digital Marketing', 'Other'];
    if (sService && !validServices.includes(sService)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid service selection' 
      });
    }

    // ===== CREATE MESSAGE =====
    const newMessage = await Message.create({ 
      name: sName, 
      email: sEmail, 
      phone: sPhone || null, 
      service: sService || null, 
      message: sMessage, 
      ip 
    });

    console.log(`✅ Message created with ID: ${newMessage.id}`);

    // ===== SEND EMAILS (non-blocking) =====
    
    // Send confirmation email to user
    if (typeof sendContactConfirmationEmail === 'function') {
      sendContactConfirmationEmail(sEmail, sName)
        .then(() => console.log('✅ Confirmation email sent to:', sEmail))
        .catch((err) => console.error('❌ Failed to send confirmation email:', err.message));
    }

    // Send notification email to admin
    if (typeof sendContactAdminNotification === 'function') {
      sendContactAdminNotification({
        name: sName,
        email: sEmail,
        phone: sPhone,
        service: sService,
        message: sMessage,
        ip: ip
      })
        .then(() => console.log('✅ Admin notification email sent'))
        .catch((err) => console.error('❌ Failed to send admin notification:', err.message));
    }

    // ===== SUCCESS RESPONSE =====
    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon!',
      data: {
        id: newMessage.id,
        name: newMessage.name,
        email: newMessage.email,
        createdAt: newMessage.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Create message error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: error.errors[0].message 
      });
    }

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        success: false, 
        error: 'Duplicate entry detected' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message. Please try again later.' 
    });
  }
});

// GET - List all messages (with rate limiting and authentication)
router.get('/', listLimiter, authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = null,
      search = null
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    
    if (status) {
      where.status = status;
    }

    // Add search functionality
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Message.findAndCountAll({ 
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ List messages error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve messages' 
    });
  }
});

// GET - Get single message by ID (admin only)
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('❌ Get message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve message'
    });
  }
});

// DELETE - Bulk delete messages (admin only)
router.delete('/bulk-delete', authenticateAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    // Validation
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of message IDs to delete'
      });
    }

    // Validate all IDs are positive integers
    const validIds = ids.every(id => {
      const num = Number(id);
      return Number.isInteger(num) && num > 0;
    });

    if (!validIds) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message IDs provided. IDs must be positive integers.'
      });
    }

    // Limit bulk delete to 100 messages at a time
    if (ids.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete more than 100 messages at once'
      });
    }

    // Delete messages
    const deletedCount = await Message.destroy({
      where: {
        id: ids
      }
    });

    console.log(`🗑️ Deleted ${deletedCount} message(s)`);

    res.json({
      success: true,
      message: `${deletedCount} message(s) deleted successfully`,
      deleted: deletedCount
    });

  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete messages'
    });
  }
});

// PATCH - Update message status (admin only)
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['unread', 'read', 'replied'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: unread, read, or replied'
      });
    }

    const message = await Message.findByPk(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    message.status = status;
    await message.save();

    console.log(`📝 Message ${id} status updated to: ${status}`);

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: message
    });

  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update message status'
    });
  }
});

// DELETE - Delete single message (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByPk(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    await message.destroy();
    
    console.log(`🗑️ Message ${id} deleted`);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

module.exports = router;