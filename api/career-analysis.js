import { prisma } from './config/prisma.js';
import { openai } from './config/openai.js';

export default async function handler(req, res) {
    const { userId } = req.body;
    try {
      // First, check for recent analysis
      const recentAnalysis = await prisma.careerAnalysis.findFirst({
        where: {
          userId, 
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago (1 day) 
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
  
      if (recentAnalysis) {
        return res.status(200).json(JSON.parse(recentAnalysis.analysis));
      }
  
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              skills: true
            }
          },
          tasks: true
        }
      });
  
      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Calculate progress
      const totalTasks = userData.tasks?.length || 0;
      const completedTasks = userData.tasks?.filter(task => task.completed)?.length || 0;
      const preexistingSkills = userData.profile?.skills?.length || 0;
  
      const progressBreakdown = {
        preexistingExperience: Math.min(preexistingSkills * 10, 40),
        appProgress: totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 0,
        totalProgress: 0
      };
  
      progressBreakdown.totalProgress = Math.min(
        progressBreakdown.preexistingExperience + progressBreakdown.appProgress,
        100
      );
  
      const response = {
        progressBreakdown,
        analysis: "Career analysis in progress...",
        nextSteps: [
          {
            step: "Complete your profile",
            reason: "A complete profile helps us provide better career guidance"
          }
        ]
      };
  
      // Save the analysis
      await prisma.careerAnalysis.create({
        data: {
          userId,
          analysis: JSON.stringify(response),
          timestamp: new Date(),
        },
      });
  
      res.status(200).json(response);
    } catch (error) {
      console.error('Error in career analysis:', error);
      res.status(500).json({ 
        error: 'Failed to generate career analysis',
        details: error.message 
      });
    }
  }
  

  
