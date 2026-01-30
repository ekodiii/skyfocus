import express from 'express';
import cors from 'cors';
import apiRoutes from './api/routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`SkyFocus server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
