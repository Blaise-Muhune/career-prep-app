import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      
      const updatedNotification = await prisma.notification.update({
        where: { 
          id: notificationId 
        },
        data: { 
          read: true 
        },
        select: {
          id: true,
          type: true,
          message: true,
          date: true,
          read: true
        }
      });
  
      res.status(200).json(updatedNotification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }