import { prisma } from './config/prisma.js';
  
 // Fetch notifications for a user
export default async function handler(req, res) {
    try {
      const userId = req.query.userId;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      const notifications = await prisma.notification.findMany({
        where: { 
          userId,
        },
        orderBy: { 
          date: 'desc' 
        },
        select: {
          id: true,
          type: true,
          message: true,
          date: true,
          read: true
        }
      });
  
      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  

  

