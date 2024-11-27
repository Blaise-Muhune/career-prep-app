import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
    try {
      const users = await prisma.user.findMany({
        include: {
          profile: {
            include: {
              skills: true,
            },
          },
        },
      });
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }