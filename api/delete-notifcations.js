import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      
      await prisma.notification.delete({
        where: { 
          id: notificationId 
        }
      });
  
      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }