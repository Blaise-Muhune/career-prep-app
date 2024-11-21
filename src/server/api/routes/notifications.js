import express from 'express';
import { prisma } from '../config/prisma.js';
import { openai } from '../config/openai.js';

const router = express.Router();

 // Fetch notifications for a user
 router.get('/', async (req, res) => {
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
  });
router.post('/:id/read', async (req, res) => {
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
  });
  
  // Delete a notification
  router.delete('/:id', async (req, res) => {
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
  });
  
  // Create a notification (useful for system notifications)
  router.post('/', async (req, res) => {
    try {
      const { userId, type, message } = req.body;
  
      if (!userId || !type || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          message,
          date: new Date(),
          read: false
        }
      });
  
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Failed to create notification' });
    }
  });

export const notificationsRouter = router; 