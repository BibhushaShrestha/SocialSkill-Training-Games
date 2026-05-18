import express from 'express';
import {
  createChildProfile,
  getChildProfiles,
  getSingleChildProfile,
  updateChildProfile,
  deleteChildProfile,
} from '../controllers/childController.js';

import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createChildProfile);
router.get('/', authMiddleware, getChildProfiles);
router.get('/:id', authMiddleware, getSingleChildProfile);
router.put('/:id', authMiddleware, updateChildProfile);
router.delete('/:id', authMiddleware, deleteChildProfile);

export default router;