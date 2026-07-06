import GameProgress from '../models/GameProgress.js';
import ChildProfile from '../models/ChildProfile.js';
import questionBank from '../data/questions.js';

// ============================================================
// Algorithm 1: Rule-Based Decision (Answer Evaluation)
// ============================================================
export const checkAnswer = async (req, res) => {
  try {
    const { module, level, questionIndex, userAnswer } = req.body;

    const questions = questionBank[module]?.[level];
    if (!questions || !questions[questionIndex]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module, level, or question index',
      });
    }

    const question = questions[questionIndex];
    const correct = userAnswer === question.correct;

    res.json({
      success: true,
      correct,
      feedback: correct ? 'Correct answer' : 'Try again',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Algorithm 2: Finite State Machine (FSM) for Level Progression
// ============================================================
const levelOrder = ['easy', 'medium', 'hard'];

const fsTransition = (currentLevel, completed) => {
  const idx = levelOrder.indexOf(currentLevel);
  if (idx === -1) return null;

  const nextIdx = idx + 1;
  if (!completed || nextIdx >= levelOrder.length) return null;

  return levelOrder[nextIdx];
};

// ============================================================
// Algorithm 3: Threshold-Based Reward (Stars & Badges)
// ============================================================
const calculateReward = (score, total) => {
  const pct = total > 0 ? (score / total) * 100 : 0;

  if (pct === 100) return { stars: 3, badge: 'Gold' };
  if (pct >= 70) return { stars: 2, badge: 'Silver' };
  if (pct >= 50) return { stars: 1, badge: 'Bronze' };
  return { stars: 0, badge: 'None' };
};

// ============================================================
// Save quiz result (uses Algos 2, 3, 4)
// ============================================================
export const saveGameProgress = async (req, res) => {
  try {
    const { child, module, level, score, total, completed } = req.body;

    const reward = calculateReward(score, total);

    const progress = await GameProgress.findOneAndUpdate(
      { child, module, level },
      { score, total, starsEarned: reward.stars, badge: reward.badge, completed },
      { upsert: true, new: true, runValidators: true }
    );

    if (completed) {
      const childProfile = await ChildProfile.findById(child);
      if (!childProfile) {
        return res.status(404).json({ success: false, message: 'Child profile not found' });
      }

      // ---- Algorithm 2: FSM - unlock next level ----
      const nextLevel = fsTransition(level, completed);
      // (nextLevel is just returned; frontend polls /api/games/module/:module for state)

      // ---- Algorithm 3: Award stars & badge to profile ----
      childProfile.stars += reward.stars;
      if (reward.badge !== 'None' && !childProfile.badges.includes(reward.badge)) {
        childProfile.badges.push(reward.badge);
      }

      // ---- Algorithm 4: Score Aggregation ----
      childProfile.totalCorrect += score;
      childProfile.totalQuestions += total;
      const aggPct = childProfile.totalQuestions > 0
        ? Math.round((childProfile.totalCorrect / childProfile.totalQuestions) * 100)
        : 0;
      childProfile.overallProgress = aggPct;

      // ---- Update per-module level percentages (for profile display) ----
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      const existing = childProfile.moduleProgress.find(m => m.module === module);
      if (existing) {
        if (level === 'easy') existing.easy = Math.max(existing.easy, pct);
        else if (level === 'medium') existing.medium = Math.max(existing.medium, pct);
        else if (level === 'hard') existing.hard = Math.max(existing.hard, pct);
      } else {
        const entry = { module };
        if (level === 'easy') entry.easy = pct;
        else if (level === 'medium') entry.medium = pct;
        else if (level === 'hard') entry.hard = pct;
        childProfile.moduleProgress.push(entry);
      }

      await childProfile.save();
    }

    res.status(200).json({
      success: true,
      progress,
      reward,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Get game progress by child ID
// ============================================================
export const getGameProgress = async (req, res) => {
  try {
    const progress = await GameProgress.find({ child: req.params.childId });

    res.status(200).json({
      success: true,
      progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// Algorithm 2 (continued): Get module unlock state (FSM)
// ============================================================
export const getModuleProgress = async (req, res) => {
  try {
    const profile = await ChildProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const progress = await GameProgress.find({
      child: profile._id,
      module: req.params.module,
    });

    const completed = {};
    progress.forEach(p => { if (p.completed) completed[p.level] = true; });

    const states = {};
    for (const level of levelOrder) {
      if (completed[level]) {
        states[level] = 'completed';
      } else if (level === 'easy' || completed[levelOrder[levelOrder.indexOf(level) - 1]]) {
        states[level] = 'unlocked';
      } else {
        states[level] = 'locked';
      }
    }

    res.status(200).json({ success: true, module: req.params.module, completed, states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Algorithm 4: Get dashboard with score aggregation
// ============================================================
export const getDashboard = async (req, res) => {
  try {
    const profile = await ChildProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'No child profile found' });
    }

    const gameProgress = await GameProgress.find({ child: profile._id });

    res.status(200).json({
      success: true,
      dashboard: {
        id: profile._id,
        childName: profile.childName,
        stars: profile.stars,
        overallProgress: profile.overallProgress,
        totalCorrect: profile.totalCorrect,
        totalQuestions: profile.totalQuestions,
        moduleProgress: profile.moduleProgress,
        badges: profile.badges,
        gameProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
