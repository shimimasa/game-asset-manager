import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { compressionMiddleware, etagMiddleware, cacheControlMiddleware } from './middleware/optimizationMiddleware';
import { helmetConfig, sanitizeInput, securityHeaders, sqlInjectionProtection } from './middleware/security';
import { apiRateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';
import promptRoutes from './routes/promptRoutes';
import projectRoutes from './routes/projectRoutes';
import exportRoutes from './routes/exportRoutes';

export const app = express();

// Security middleware
app.use(helmetConfig);
app.use(securityHeaders);

// Optimization middleware
app.use(compressionMiddleware);
app.use(etagMiddleware);
app.use(cacheControlMiddleware);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(sanitizeInput);
app.use(sqlInjectionProtection);

// Rate limiting
app.use(apiRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);