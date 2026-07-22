import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes from './routes/authRoutes.js';
import childRoutes from './routes/childRoutes.js';
import gameRoutes from './routes/gameRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => {
  res.send('Social Skill Training Backend Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/games', gameRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }
};

startServer();
