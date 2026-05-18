import GameProgress from '../models/GameProgress.js';
import ChildProfile from '../models/ChildProfile.js';

export const saveGameProgress = async (req, res) => {
  try {
    const { child, module, level, score, total, completed } = req.body;

    const progress = await GameProgress.findOneAndUpdate(
      { child, module, level },
      { score, total, starsEarned: score, completed },
      { upsert: true, new: true, runValidators: true }
    );

    if (completed) {
      const childProfile = await ChildProfile.findById(child);
      if (childProfile) {
        const pct = total > 0 ? Math.round((score / total) * 100) : 0;

        const existing = childProfile.moduleProgress.find(
          m => m.module === module
        );
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

        const totalModules = childProfile.moduleProgress.length;
        if (totalModules > 0) {
          const totalPct = childProfile.moduleProgress.reduce((sum, m) => {
            const avg = (m.easy + m.medium + m.hard) / 3;
            return sum + avg;
          }, 0);
          childProfile.overallProgress = Math.round(totalPct / totalModules);
        }

        childProfile.stars += score;
        await childProfile.save();
      }
    }

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

    res.status(200).json({ success: true, module: req.params.module, completed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const profile = await ChildProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'No child profile found',
      });
    }

    const gameProgress = await GameProgress.find({ child: profile._id });

    res.status(200).json({
      success: true,
      dashboard: {
        id: profile._id,
        childName: profile.childName,
        stars: profile.stars,
        overallProgress: profile.overallProgress,
        moduleProgress: profile.moduleProgress,
        badges: profile.badges,
        gameProgress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
