import express from 'express';

import {
  saveGameProgress,
  getGameProgress,
  getModuleProgress,
  getDashboard,
} from '../controllers/gameController.js';

import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard/me', authMiddleware, getDashboard);
router.get('/module/:module', authMiddleware, getModuleProgress);
router.post('/', authMiddleware, saveGameProgress);
router.get('/:childId', authMiddleware, getGameProgress);

export default router;
