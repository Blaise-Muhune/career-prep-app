import { prisma } from './config/prisma.js';


  // Example: Delete a user
export default async function handler(req, res) {
    const userId = req.params.id;
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
  
 
  