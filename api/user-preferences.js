import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
    const userId = req.params.id;
    const { preferences } = req.body;
    
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          preferences
        }
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }