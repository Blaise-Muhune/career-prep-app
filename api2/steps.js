import { prisma } from '../config/prisma.js';

export default async function handler(req, res) {
    const stepId = parseInt(req.params.stepId, 10);
    const { userId } = req.query;
    
    if (!userId || !stepId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    try {
      const stepProgress = await prisma.stepProgress.findUnique({
        where: {
          userId_stepId: {
            userId,
            stepId
          }
        }
      });
  
      // Get the career analysis
      const recentAnalysis = await prisma.careerAnalysis.findFirst({
        where: { userId },
        orderBy: { timestamp: 'desc' }
      });
  
      if (!recentAnalysis) {
        return res.status(404).json({ error: 'No career analysis found' });
      }
  
      const analysis = JSON.parse(recentAnalysis.analysis);
      const stepIndex = parseInt(stepId) - 1;
      const step = analysis.tasks[stepIndex];
      
      if (!step) {
        return res.status(404).json({ error: 'Step not found' });
      }
  
      // Calculate timeline progress if step is started
      let timelineProgress = 0;
      let status = 'NOT_STARTED';
      
      if (stepProgress?.startedAt) {
        const startDate = new Date(stepProgress.startedAt);
        const timeframe = parseDuration(step.timeframe); // Helper function to parse "2 weeks", "1 month", etc.
        const endDate = new Date(startDate.getTime() + timeframe);
        const now = new Date();
        
        if (stepProgress.completed) {
          status = 'COMPLETED';
          timelineProgress = 100;
        } else {
          status = 'IN_PROGRESS';
          const totalDuration = endDate.getTime() - startDate.getTime();
          const elapsed = now.getTime() - startDate.getTime();
          timelineProgress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
        }
      }
      
      res.status(200).json({
        id: parseInt(stepId),
        title: step.title,
        description: step.description,
        timeframe: step.timeframe,
        priority: step.priority,
        status,
        timelineProgress,
        startedAt: stepProgress?.startedAt || null,
        completedAt: stepProgress?.completedAt || null
      });
    } catch (error) {
      console.error('Error fetching step:', error);
      res.status(500).json({ error: 'Failed to fetch step details' });
    }
  }
  
  // Add endpoint to start a step
  export async function handler(req, res) {
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

  function parseDuration(timeframe) {
    const number = parseInt(timeframe);
    if (timeframe.includes('week')) {
      return number * 7 * 24 * 60 * 60 * 1000;
    } else if (timeframe.includes('month')) {
      return number * 30 * 24 * 60 * 60 * 1000;
    } else if (timeframe.includes('day')) {
      return number * 24 * 60 * 60 * 1000;
    }
    return 14 * 24 * 60 * 60 * 1000; // Default to 2 weeks
  }

