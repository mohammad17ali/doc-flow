import express, { Application } from 'express';
import cors from 'cors';
import documentRoutes from './routes/documentRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import batchRoutes from './routes/batchRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { OUTPUTS_DIR, PDFS_DIR } from './config/paths';
import { connectToDatabase } from './config/database';
import { UserModel } from './models/User';
import { UserGroupModel } from './models/UserGroup';
import { SessionModel } from './models/Session';
import { DocumentModel } from './models/Document';

const app: Application = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve images as static files
app.use('/images', express.static(OUTPUTS_DIR));

// Serve PDFs as static files
app.use('/pdfs', express.static(PDFS_DIR));

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
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/batch_jobs', batchRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Create database indexes
    await UserModel.createIndexes();
    await UserGroupModel.createIndexes();
    await SessionModel.createIndexes();
    await DocumentModel.createIndexes();
    
    console.log('✅ Database indexes created');

    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 API: http://localhost:${PORT}/api`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`👤 Admin: http://localhost:${PORT}/api/admin`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
