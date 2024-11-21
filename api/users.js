import express from 'express';
import { prisma } from '../config/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
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
  });
  
  // Example: Create a new user
router.post('/', async (req, res) => {
    console.log('Received user creation request:', req.body);
    
    try {
      const { 
        id, 
        email, 
        name, 
        bio, 
        skills, 
        dreamJob, 
        dreamCompany, 
        dreamSalary 
      } = req.body;
  
      // Validate required fields
      if (!id || !email || !name) {
        console.log('Missing required fields:', { id, email, name });
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['id', 'email', 'name'],
          received: { id, email, name }
        });
      }
  
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
  
      let user;
      if (existingUser) {
        // Update existing user
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            dreamJob: dreamJob || 'Unknown'
          }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            id,
            email,
            name,
            dreamJob: dreamJob || 'Unknown'
          }
        });
      }
  
      // Handle profile
      const profile = await prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          bio,
          dreamJob,
          dreamCompany,
          dreamSalary,
          skills: {
            create: skills?.map(skill => ({
              name: skill
            })) || []
          }
        },
        update: {
          bio,
          dreamJob,
          dreamCompany,
          dreamSalary,
          skills: {
            deleteMany: {},
            create: skills?.map(skill => ({
              name: skill
            })) || []
          }
        },
        include: {
          skills: true
        }
      });
  
      // Return the complete user data
      const userData = {
        ...user,
        profile
      };
  
      console.log('User created/updated successfully:', userData.id);
      res.status(201).json(userData);
    } catch (error) {
      console.error('Error creating/updating user:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          error: 'Email already exists',
          details: 'A user with this email already exists in the system'
        });
      }
      
      res.status(500).json({
        error: 'Failed to create/update user',
        details: error.message
      });
    }
  });

  router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              skills: true,
            },
          },
          tasks: {
            where: { completed: false }, // Only get incomplete tasks
            orderBy: { dueDate: 'asc' },
          },
          stepProgress: {
            orderBy: { stepId: 'asc' },
          },
        },
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Format the response to include only necessary data
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        dreamJob: user.dreamJob,
        profile: user.profile ? {
          bio: user.profile.bio,
          dreamJob: user.profile.dreamJob,
          dreamCompany: user.profile.dreamCompany,
          dreamSalary: user.profile.dreamSalary,
          skills: user.profile.skills.map(skill => ({
            id: skill.id,
            name: skill.name
          }))
        } : null,
        tasks: user.tasks.map(task => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          completed: task.completed
        })),
        stepProgress: user.stepProgress
      };
  
      res.status(200).json(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });
  
  // Example: Update a user's profile
  router.put('/:id', async (req, res) => {
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
  });
  
  // Example: Delete a user
  router.delete('/:id', async (req, res) => {
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
  });
  
 
  
export const usersRouter = router; 