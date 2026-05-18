import ChildProfile from '../models/ChildProfile.js';

export const createChildProfile = async (req, res) => {
  try {
    const { childName, age } = req.body;

    if (!childName || !age) {
      return res.status(400).json({
        success: false,
        message: 'Child name and age are required',
      });
    }

    const profile = await ChildProfile.create({
      childName,
      age,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Child profile created successfully',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getChildProfiles = async (req, res) => {
  try {
    const profiles = await ChildProfile.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleChildProfile = async (req, res) => {
  try {
    const profile = await ChildProfile.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found',
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateChildProfile = async (req, res) => {
  try {
    const { childName, age, moduleProgress } = req.body;

    const profile = await ChildProfile.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found',
      });
    }

    if (childName) profile.childName = childName;
    if (age) profile.age = age;

    if (moduleProgress) {
      for (const incoming of moduleProgress) {
        const existing = profile.moduleProgress.find(
          m => m.module === incoming.module
        );
        if (existing) {
          if (incoming.easy !== undefined) existing.easy = incoming.easy;
          if (incoming.medium !== undefined) existing.medium = incoming.medium;
          if (incoming.hard !== undefined) existing.hard = incoming.hard;
        } else {
          profile.moduleProgress.push(incoming);
        }
      }

      const totalModules = profile.moduleProgress.length;
      if (totalModules > 0) {
        const totalPct = profile.moduleProgress.reduce((sum, m) => {
          const avg = (m.easy + m.medium + m.hard) / 3;
          return sum + avg;
        }, 0);
        profile.overallProgress = Math.round(totalPct / totalModules);
      }
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Child profile updated successfully',
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteChildProfile = async (req, res) => {
  try {
    const profile = await ChildProfile.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found',
      });
    }

    await profile.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Child profile deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
