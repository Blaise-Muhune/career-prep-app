import { prisma } from './config/prisma.js';

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
  

