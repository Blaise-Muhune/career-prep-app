import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
    const userId = req.params.id;
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              skills: true,
            },
          },
          tasks: {
            where: { completed: false }, // Only get incomplete tasks
            orderBy: { dueDate: 'asc' },
          },
          stepProgress: {
            orderBy: { stepId: 'asc' },
          },
        },
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Format the response to include only necessary data
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        dreamJob: user.dreamJob,
        profile: user.profile ? {
          bio: user.profile.bio,
          dreamJob: user.profile.dreamJob,
          dreamCompany: user.profile.dreamCompany,
          dreamSalary: user.profile.dreamSalary,
          skills: user.profile.skills.map(skill => ({
            id: skill.id,
            name: skill.name
          }))
        } : null,
        tasks: user.tasks.map(task => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          completed: task.completed
        })),
        stepProgress: user.stepProgress
      };
  
      res.status(200).json(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }