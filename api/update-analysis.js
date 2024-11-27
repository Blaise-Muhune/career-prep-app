import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
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
  }