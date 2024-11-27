import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
    try {
      const { userId } = req.params;
      console.log('Fetching subscription for userId:', userId);
  
      const subscription = await prisma.subscription.findFirst({
        where: { 
          userId,
          active: true
        }
      });
  
      console.log('Database query result:', subscription);
  
      if (!subscription) {
        return res.status(404).json({ 
          error: 'No active subscription found',
          userId 
        });
      }
  
      const response = {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      };
  
      console.log('Sending subscription response:', response);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ 
        error: 'Failed to fetch subscription details',
        details: error.message,
        userId: req.params.userId
      });
    }
  }