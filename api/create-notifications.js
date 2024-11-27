import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
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
  }