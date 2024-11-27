import { prisma } from './config/prisma.js';
    
export default async function handler(req, res) {
    const { stepId } = req.params;
    const { userId } = req.body;
    
    try {
      const stepProgress = await prisma.stepProgress.upsert({
        where: {
          userId_stepId: {
            userId,
            stepId: parseInt(stepId)
          }
        },
        update: {
          startedAt: new Date(),
          status: 'IN_PROGRESS'
        },
        create: {
          userId,
          stepId: parseInt(stepId),
          startedAt: new Date(),
          status: 'IN_PROGRESS'
        }
      });
  
      // Create a notification with stepId
      await prisma.notification.create({
        data: {
          userId,
          type: 'info',
          message: `You've started step ${stepId}. Good luck!`,
          date: new Date(),
          stepId: parseInt(stepId) // Add the stepId to the notification
        }
      });
      
      res.status(200).json(stepProgress);
    } catch (error) {
      console.error('Error starting step:', error);
      res.status(500).json({ error: 'Failed to start step' });
    }
  }
