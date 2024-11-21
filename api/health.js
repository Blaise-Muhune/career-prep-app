import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    console.log('Health check successful');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export const healthRouter = router; 