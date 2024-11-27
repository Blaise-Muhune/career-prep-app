import { prisma } from '../config/prisma.js';
import { openai } from '../config/openai.js';

export default function handler(req, res) {
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
  });
  
router.post('/refresh', async (req, res) => {
    const { userId } = req.body;
    
    try {
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              skills: true
            }
          },
          tasks: {
            where: { completed: true }
          }
        }
      });
  
      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const prompt = `
      Analyze this person's career profile and provide a structured response:
      
      Current Profile:
      - Dream Job: ${userData.profile?.dreamJob || 'Not specified'}
      - Current Skills: ${userData.profile?.skills.map(s => s.name).join(', ') || 'None listed'}
      - Bio/Resume: ${userData.profile?.bio || 'Not provided'}
      - Completed Tasks: ${userData.tasks.length} tasks
  
      Provide your response in the following JSON format:
      {
        "progressPercentage": number between 0-100,
        "tasks": [
          {
            "title": "task title",
            "description": "detailed description",
            "timeframe": "estimated time to complete",
            "priority": "high/medium/low"
          }
        ],
        "nextSteps": [
          {
            "step": "specific action item",
            "reason": "why this step is important"
          }
        ],
        "analysis": "brief explanation of the progress evaluation"
      }
      
      Ensure the response is valid JSON and includes practical, specific tasks and steps.
      `;
  
      const completion = await openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "You are a career advisor that provides structured JSON responses with specific, actionable career development plans." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        model: "gpt-4-turbo-preview",
        response_format: { type: "json_object" }
      });
  
      const response = JSON.parse(completion.choices[0].message.content);
      
      // Save the new analysis
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
      res.status(500).json({ error: 'Failed to generate career analysis' });
    }
  });
  
