import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
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
  }