import express from 'express';
import { loginUser, registerUser, sendOtp, verifyOtp, resetPasswordWithOtp } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPasswordWithOtp);

export default router;
