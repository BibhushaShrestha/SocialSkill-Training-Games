import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ChildProfile from '../models/ChildProfile.js';
import { sendOtpSms } from '../config/sms.js';

const normalizePhone = (p) => (p || '').replace(/\D/g, '');

// ---- SEND OTP ----
export const sendOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      // Fallback: maybe the user registered before phone field was added
      const legacyUser = await User.findOne({ email: req.body.phone });
      if (legacyUser) {
        legacyUser.phone = phone;
        await legacyUser.save();
        return await sendOtpForUser(legacyUser, phone, res);
      }
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that number, an OTP has been sent.',
      });
    }

    return await sendOtpForUser(user, phone, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function sendOtpForUser(user, phone, res) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpire = Date.now() + 600000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  const result = await sendOtpSms(phone, otp);

  if (result?.devMode) {
    return res.status(200).json({
      success: true,
      message: 'OTP sent (dev mode — see below).',
      otp: result.otp,
    });
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent to your phone.',
  });
}

// ---- VERIFY OTP ----
export const verifyOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const user = await User.findOne({
      phone,
      otp,
      otpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Issue a short-lived temp token for password reset
    const tempToken = jwt.sign(
      { phone: user.phone, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' },
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      tempToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- RESET PASSWORD (after OTP verification) ----
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { tempToken, password } = req.body;

    if (!tempToken || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (_) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token. Please verify OTP again.' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ success: false, message: 'Invalid token purpose' });
    }

    const user = await User.findOne({ phone: decoded.phone });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- REGISTER USER ----
export const registerUser = async (req, res) => {
  try {
    const { childName, username, email } = req.body;
    const phone = normalizePhone(req.body.phone);
    const { password } = req.body;

    if (!childName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Child name, username, and password are required',
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      childName,
      username,
      email,
      phone,
      password: hashedPassword,
    });

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
