import { prisma } from '../config/prisma.js';
import { openai } from '../config/openai.js';

export default async function handler(req, res) {
    try {
      const userId = req.query.userId; // Assuming you have user authentication and can get the user ID
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        // where: { id: 6 },
        include: {
          tasks: {
            where: { completed: false }, // Fetch only incomplete tasks
          },
        },
      });
  
      if (!userProfile) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const userData = {
        name: userProfile.name,
        dreamJob: userProfile.dreamJob,
        overallProgress: calculateOverallProgress(userProfile.tasks), // Implement this function as needed
        upcomingTasks: userProfile.tasks.map(task => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate.toISOString(), // Convert DateTime to string
          completed: task.completed,
        })),
      };
  
      res.status(200).json(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }
  
  function calculateOverallProgress(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    return (completedTasks / totalTasks) * 100;
  }
  

export default async function handler(req, res) {
    const { userId } = req.body;
    try {
      // First, check for recent analysis
      const recentAnalysis = await prisma.careerAnalysis.findFirst({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
  
      if (recentAnalysis) {
        return res.status(200).json(JSON.parse(recentAnalysis.analysis));
      }
  
      // Get user data with proper null checks
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
  
      // Calculate progress with null checks
      const totalTasks = userData.tasks?.length || 0;
      const completedTasks = userData.tasks?.filter(task => task.completed)?.length || 0;
      const preexistingSkills = userData.profile?.skills?.length || 0;
  
      const progressBreakdown = {
        preexistingExperience: Math.min(preexistingSkills * 10, 40), // Cap at 40%
        appProgress: totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 0, // Max 60%
        totalProgress: 0
      };
  
      progressBreakdown.totalProgress = Math.min(
        progressBreakdown.preexistingExperience + progressBreakdown.appProgress,
        100
      );
  
      // Create the analysis
      const prompt = `
        Analyze this person's career profile and provide a structured response:
        
        Current Profile:
        - Dream Job: ${userData.profile?.dreamJob || 'Not specified'}
        - Current Skills: ${userData.profile?.skills?.map(s => s.name).join(', ') || 'None listed'}
        - Bio/Resume: ${userData.profile?.bio || 'Not provided'}
        - Completed Tasks: ${completedTasks} out of ${totalTasks} tasks
  
        Progress Breakdown:
        - Pre-existing Experience: ${progressBreakdown.preexistingExperience}%
        - App Progress: ${progressBreakdown.appProgress}%
        - Total Progress: ${progressBreakdown.totalProgress}%
  
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

