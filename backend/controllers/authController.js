import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import ChildProfile from '../models/ChildProfile.js';
import { sendResetEmail } from '../config/email.js';

// ---- FORGOT PASSWORD (sends email with reset link) ----
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetLink = `http://localhost:5000/reset_password.html?token=${resetToken}`;

    // Attempt to send email; log link regardless for dev
    try {
      await sendResetEmail(user.email, resetLink);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    console.log(`Reset link for ${email}: ${resetLink}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
      resetLink,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- RESET PASSWORD (via email token) ----
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- REGISTER USER ----
export const registerUser = async (req, res) => {
  try {
    const { childName, username, email, phone, password } = req.body;

    if (!childName || !username || !password) {
      return res.status(400).json({ success: false, message: 'Child name, username, and password are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ childName, username, email, phone, password: hashedPassword });

    await ChildProfile.create({
      childName,
      user: user._id,
      moduleProgress: [
        { module: 'greeting', easy: 0, medium: 0, hard: 0 },
        { module: 'sharing', easy: 0, medium: 0, hard: 0 },
        { module: 'waiting', easy: 0, medium: 0, hard: 0 },
        { module: 'emotion', easy: 0, medium: 0, hard: 0 },
        { module: 'communication', easy: 0, medium: 0, hard: 0 },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: { id: user._id, childName: user.childName, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- LOGIN USER ----
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, childName: user.childName, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
