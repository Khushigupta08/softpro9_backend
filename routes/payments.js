const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

const STUDENT_JWT_SECRET = process.env.STUDENT_JWT_SECRET || 'default_student_secret';

const verifyStudent = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token required' });
  try {
    req.user = jwt.verify(token, STUDENT_JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Create a payment (mock / create payment intent)
router.post('/create', verifyStudent, async (req, res) => {
  try {
    const { courseId, amount, currency = 'INR', upiId, paymentMethod } = req.body;
    
    if (!courseId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'courseId, amount and paymentMethod are required' });
    }

    // Validate payment method specific requirements
    if (paymentMethod === 'UPI' && (!upiId || typeof upiId !== 'string' || !upiId.includes('@'))) {
      return res.status(400).json({ message: 'Valid UPI ID is required for UPI payments' });
    }

    const payment = await Payment.create({
      studentId: req.user.id,
      courseId,
      amount,
      currency,
      status: 'pending',
      provider: paymentMethod.toLowerCase(),
      metadata: { 
        paymentMethod,
        ...(upiId && { upiId }),
        initiatedAt: new Date().toISOString()
      }
    });

    // create or update a pending enrollment to ensure enrollment isn't active until payment confirmed
    const existing = await Enrollment.findOne({ where: { studentId: req.user.id, courseId } });
    if (!existing) {
      await Enrollment.create({ studentId: req.user.id, courseId, status: 'pending', paymentId: payment.id });
    } else {
      existing.status = 'pending';
      existing.paymentId = payment.id;
      await existing.save();
    }

    // In a production UPI flow you'd return a payment url / deeplink or transaction id.
    res.json({ paymentId: payment.id, clientSecret: `upi_mock_client_${payment.id}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment', error: err.message });
  }
});

// Confirm payment (called by frontend after gateway success or webhook)
router.post('/confirm', verifyStudent, async (req, res) => {
  try {
    const { paymentId, providerPaymentId, upiId } = req.body;
    if (!paymentId || !providerPaymentId) return res.status(400).json({ message: 'paymentId and providerPaymentId required' });

    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.studentId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const paymentMethod = payment.metadata?.paymentMethod;
    
    // Validate based on payment method
    if (paymentMethod === 'UPI') {
      const recordedUpi = payment.metadata?.upiId;
      if (recordedUpi && upiId && recordedUpi !== upiId) {
        return res.status(400).json({ message: 'UPI ID does not match the original payment request' });
      }

      // Verify UPI transaction ID format
      if (!String(providerPaymentId).startsWith('upi_')) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ message: 'Invalid UPI transaction ID' });
      }
    } else if (paymentMethod === 'Net Banking') {
      // Verify net banking transaction ID format
      if (!String(providerPaymentId).startsWith('nb_')) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ message: 'Invalid Net Banking transaction ID' });
      }
    } else if (paymentMethod === 'Cash') {
      // For cash payments, allow any transaction ID format
    } else {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    payment.status = 'completed';
    payment.providerPaymentId = providerPaymentId;
    payment.metadata = { ...(payment.metadata || {}), transactionTime: new Date().toISOString(), upiId: recordedUpi };
    await payment.save();

    // activate enrollment
    const existing = await Enrollment.findOne({ where: { studentId: req.user.id, courseId: payment.courseId } });
    if (existing) {
      existing.status = 'active';
      existing.paymentId = payment.id;
      await existing.save();
    } else {
      await Enrollment.create({ studentId: req.user.id, courseId: payment.courseId, status: 'active', paymentId: payment.id });
    }

    const course = await Course.findByPk(payment.courseId);

    res.json({ success: true, payment: payment.toJSON(), enrolledCourse: course });
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm payment', error: err.message });
  }
});

// Admin: list all payments (include student username/email where available)
router.get('/all', async (req, res) => {
  try {
    const payments = await Payment.findAll({ order: [['createdAt', 'DESC']], limit: 200 });
    const enriched = await Promise.all(payments.map(async (p) => {
      const obj = p.toJSON();
      try {
        const u = await User.findByPk(obj.studentId);
        obj.student = u ? { id: u.id, username: u.username } : null;
      } catch (e) {
        obj.student = null;
      }
      return obj;
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments', error: err.message });
  }
});

module.exports = router;
