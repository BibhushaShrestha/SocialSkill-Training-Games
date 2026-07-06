import mongoose from 'mongoose';

const gameProgressSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChildProfile',
      required: true,
    },
    module: {
      type: String,
      required: true,
      enum: ['greeting', 'sharing', 'waiting', 'emotion', 'communication'],
    },
    level: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
    },
    score: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 5,
    },
    starsEarned: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
      enum: ['Gold', 'Silver', 'Bronze', 'None'],
      default: 'None',
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

gameProgressSchema.index({ child: 1, module: 1, level: 1 }, { unique: true });

const GameProgress = mongoose.model('GameProgress', gameProgressSchema);

export default GameProgress;
