import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
    const userId = req.params.id;
    const { name, bio, skills, dreamJob, dreamCompany, dreamSalary } = req.body;
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          dreamJob,
          profile: {
            upsert: {
              create: {
                bio,
                skills: {
                  create: skills.map(skill => ({ name: skill })),
                },
                dreamJob,
                dreamCompany,
                dreamSalary,
              },
              update: {
                bio,
                skills: {
                  deleteMany: {},
                  create: skills.map(skill => ({ name: skill })),
                },
                dreamJob,
                dreamCompany,
                dreamSalary,
              },
            },
          },
        },
        include: {
          profile: {
            include: {
              skills: true,
            },
          },
        },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
