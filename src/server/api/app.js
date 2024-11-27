import express from 'express';
import cors from 'cors';
import { webhookRouter } from './routes/webhook.js';
import { usersRouter } from './routes/users.js';
import { subscriptionRouter } from './routes/subscription.js';
import { checkoutRouter } from './routes/create-checkout-session.js';
import { profileRouter } from './routes/profile.js';
import { healthRouter } from './routes/health.js';
import { careerAnalysisRouter } from './routes/career-analysis.js';
import { stepsRouter } from './routes/steps.js';
import { notificationsRouter } from './routes/notifications.js';


const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
}));

// Configure raw body handling for webhook
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json());

// Routes
app.use('/api/webhook', webhookRouter);
app.use('/api/users', usersRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/profile', profileRouter);
app.use('/api/health', healthRouter);
app.use('/api/career-analysis', careerAnalysisRouter);
app.use('/api/steps', stepsRouter);
app.use('/api/notifications', notificationsRouter);
// Error handling middleware
app.use((err, req, res, next) => {
  console.log('Error:', req, next);
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app; 