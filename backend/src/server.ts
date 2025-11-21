import express, { Application } from 'express';
import cors from 'cors';
import documentRoutes from './routes/documentRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/documents', documentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

export default app;
