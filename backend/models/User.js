import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  childName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    sparse: true,
  },
  phone: {
    type: String,
    sparse: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: String,
  otpExpire: Date,
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
