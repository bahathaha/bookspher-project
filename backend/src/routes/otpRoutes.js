import express from 'express';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// store OTP temporarily
const otpStore = {};

// ================= TOKEN =================
const generateToken = userId => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15d',
  });
};

// ================= EMAIL =================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'a89541833@gmail.com',
    pass: 'bhfmwgyyhxswsyzo', // ⚠️ put app password
  },
});

// ================= SEND OTP =================
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    // 🔥 CHECK USER EXISTS
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: 'Email not registered. Please sign up first.',
      });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    await transporter.sendMail({
      from: 'a89541833@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}`,
    });

    res.json({ message: 'OTP sent' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ================= VERIFY OTP =================
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] != otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  delete otpStore[email];

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: 'Email not registered. Please sign up first.',
      });
    }

    // 🔥 LOGIN USER
    const token = generateToken(user._id);

    res.json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
