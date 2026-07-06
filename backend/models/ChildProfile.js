import mongoose from 'mongoose';

const moduleProgressSchema = new mongoose.Schema({
  module: { type: String, required: true },
  easy: { type: Number, default: 0 },
  medium: { type: Number, default: 0 },
  hard: { type: Number, default: 0 },
}, { _id: false });

const childProfileSchema = new mongoose.Schema(
  {
    childName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 1,
      max: 18,
    },
    stars: {
      type: Number,
      default: 0,
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    moduleProgress: [moduleProgressSchema],
    totalCorrect: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ChildProfile = mongoose.model('ChildProfile', childProfileSchema);

export default ChildProfile;
