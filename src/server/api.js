import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import OpenAI from 'openai';
import Stripe from 'stripe';

const app = express();
const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Middleware
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Update if frontend is hosted elsewhere
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Add the /api/userProfile endpoint
app.get('/api/userProfile', async (req, res) => {
  try {
    const userId = req.query.userId; // Assuming you have user authentication and can get the user ID
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      // where: { id: 6 },
      include: {
        tasks: {
          where: { completed: false }, // Fetch only incomplete tasks
        },
      },
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = {
      name: userProfile.name,
      dreamJob: userProfile.dreamJob,
      overallProgress: calculateOverallProgress(userProfile.tasks), // Implement this function as needed
      upcomingTasks: userProfile.tasks.map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate.toISOString(), // Convert DateTime to string
        completed: task.completed,
      })),
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

function calculateOverallProgress(tasks) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  return (completedTasks / totalTasks) * 100;
}

// Example: Get all users with their profiles and skills
app.get('/api/users', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Example: Create a new user
app.post('/api/users', async (req, res) => {
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

// Example: Update a user's profile
app.put('/api/users/:id', async (req, res) => {
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
app.delete('/api/users/:id', async (req, res) => {
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

// Fetch notifications for a user
app.get('/api/notifications', async (req, res) => {
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

// Mark a notification as read
app.post('/api/notifications/:id/read', async (req, res) => {
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
app.delete('/api/notifications/:id', async (req, res) => {
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
app.post('/api/notifications', async (req, res) => {
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

// Add this new endpoint
app.post('/api/chat', async (req, res) => {
  const { message, userId } = req.body;
  
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful career advisor assistant. Provide concise, practical advice." 
        },
        { 
          role: "user", 
          content: message 
        }
      ],
      model: "gpt-3.5-turbo",
    });

    const response = completion.choices[0].message.content;
    
    // Optionally save the conversation to your database
    await prisma.chatHistory.create({
      data: {
        userId,
        message,
        response,
        timestamp: new Date(),
      },
    });

    res.status(200).json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

app.post('/api/structure-profile', async (req, res) => {
  const { userId } = req.body;
  try {
    // First, check for recent analysis
    const recentAnalysis = await prisma.careerAnalysis.findFirst({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (recentAnalysis) {
      return res.status(200).json(JSON.parse(recentAnalysis.analysis));
    }

    // Get user data with proper null checks
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true
          }
        },
        tasks: true
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate progress with null checks
    const totalTasks = userData.tasks?.length || 0;
    const completedTasks = userData.tasks?.filter(task => task.completed)?.length || 0;
    const preexistingSkills = userData.profile?.skills?.length || 0;

    const progressBreakdown = {
      preexistingExperience: Math.min(preexistingSkills * 10, 40), // Cap at 40%
      appProgress: totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 0, // Max 60%
      totalProgress: 0
    };

    progressBreakdown.totalProgress = Math.min(
      progressBreakdown.preexistingExperience + progressBreakdown.appProgress,
      100
    );

    // Create the analysis
    const prompt = `
      Analyze this person's career profile and provide a structured response:
      
      Current Profile:
      - Dream Job: ${userData.profile?.dreamJob || 'Not specified'}
      - Current Skills: ${userData.profile?.skills?.map(s => s.name).join(', ') || 'None listed'}
      - Bio/Resume: ${userData.profile?.bio || 'Not provided'}
      - Completed Tasks: ${completedTasks} out of ${totalTasks} tasks

      Progress Breakdown:
      - Pre-existing Experience: ${progressBreakdown.preexistingExperience}%
      - App Progress: ${progressBreakdown.appProgress}%
      - Total Progress: ${progressBreakdown.totalProgress}%

      Provide your response in the following JSON format:
      {
        "progressPercentage": number between 0-100,
        "tasks": [
          {
            "title": "task title",
            "description": "detailed description",
            "timeframe": "estimated time to complete",
            "priority": "high/medium/low"
          }
        ],
        "nextSteps": [
          {
            "step": "specific action item",
            "reason": "why this step is important"
          }
        ],
        "analysis": "brief explanation of the progress evaluation"
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a career advisor that provides structured JSON responses with specific, actionable career development plans." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);

    // Save the analysis
    await prisma.careerAnalysis.create({
      data: {
        userId,
        analysis: JSON.stringify(response),
        timestamp: new Date(),
      },
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in career analysis:', error);
    res.status(500).json({ 
      error: 'Failed to generate career analysis',
      details: error.message 
    });
  }
});

app.post('/api/career-analysis', async (req, res) => {
  const { userId } = req.body;
  try {
    // First, check for recent analysis
    const recentAnalysis = await prisma.careerAnalysis.findFirst({
      where: {
        userId, 
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago (1 day) 
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (recentAnalysis) {
      return res.status(200).json(JSON.parse(recentAnalysis.analysis));
    }

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true
          }
        },
        tasks: true
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate progress
    const totalTasks = userData.tasks?.length || 0;
    const completedTasks = userData.tasks?.filter(task => task.completed)?.length || 0;
    const preexistingSkills = userData.profile?.skills?.length || 0;

    const progressBreakdown = {
      preexistingExperience: Math.min(preexistingSkills * 10, 40),
      appProgress: totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 0,
      totalProgress: 0
    };

    progressBreakdown.totalProgress = Math.min(
      progressBreakdown.preexistingExperience + progressBreakdown.appProgress,
      100
    );

    const response = {
      progressBreakdown,
      analysis: "Career analysis in progress...",
      nextSteps: [
        {
          step: "Complete your profile",
          reason: "A complete profile helps us provide better career guidance"
        }
      ]
    };

    // Save the analysis
    await prisma.careerAnalysis.create({
      data: {
        userId,
        analysis: JSON.stringify(response),
        timestamp: new Date(),
      },
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in career analysis:', error);
    res.status(500).json({ 
      error: 'Failed to generate career analysis',
      details: error.message 
    });
  }
});

app.post('/api/career-analysis/refresh', async (req, res) => {
  const { userId } = req.body;
  
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true
          }
        },
        tasks: {
          where: { completed: true }
        }
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prompt = `
    Analyze this person's career profile and provide a structured response:
    
    Current Profile:
    - Dream Job: ${userData.profile?.dreamJob || 'Not specified'}
    - Current Skills: ${userData.profile?.skills.map(s => s.name).join(', ') || 'None listed'}
    - Bio/Resume: ${userData.profile?.bio || 'Not provided'}
    - Completed Tasks: ${userData.tasks.length} tasks

    Provide your response in the following JSON format:
    {
      "progressPercentage": number between 0-100,
      "tasks": [
        {
          "title": "task title",
          "description": "detailed description",
          "timeframe": "estimated time to complete",
          "priority": "high/medium/low"
        }
      ],
      "nextSteps": [
        {
          "step": "specific action item",
          "reason": "why this step is important"
        }
      ],
      "analysis": "brief explanation of the progress evaluation"
    }
    
    Ensure the response is valid JSON and includes practical, specific tasks and steps.
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a career advisor that provides structured JSON responses with specific, actionable career development plans." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    
    // Save the new analysis
    await prisma.careerAnalysis.create({
      data: {
        userId,
        analysis: JSON.stringify(response),
        timestamp: new Date(),
      },
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in career analysis:', error);
    res.status(500).json({ error: 'Failed to generate career analysis' });
  }
});

// Update the step endpoint to include timeline information
app.get('/api/steps/:stepId', async (req, res) => {
  const stepId = parseInt(req.params.stepId, 10);
  const { userId } = req.query;
  
  if (!userId || !stepId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const stepProgress = await prisma.stepProgress.findUnique({
      where: {
        userId_stepId: {
          userId,
          stepId
        }
      }
    });

    // Get the career analysis
    const recentAnalysis = await prisma.careerAnalysis.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });

    if (!recentAnalysis) {
      return res.status(404).json({ error: 'No career analysis found' });
    }

    const analysis = JSON.parse(recentAnalysis.analysis);
    const stepIndex = parseInt(stepId) - 1;
    const step = analysis.tasks[stepIndex];
    
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Calculate timeline progress if step is started
    let timelineProgress = 0;
    let status = 'NOT_STARTED';
    
    if (stepProgress?.startedAt) {
      const startDate = new Date(stepProgress.startedAt);
      const timeframe = parseDuration(step.timeframe); // Helper function to parse "2 weeks", "1 month", etc.
      const endDate = new Date(startDate.getTime() + timeframe);
      const now = new Date();
      
      if (stepProgress.completed) {
        status = 'COMPLETED';
        timelineProgress = 100;
      } else {
        status = 'IN_PROGRESS';
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        timelineProgress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
      }
    }
    
    res.status(200).json({
      id: parseInt(stepId),
      title: step.title,
      description: step.description,
      timeframe: step.timeframe,
      priority: step.priority,
      status,
      timelineProgress,
      startedAt: stepProgress?.startedAt || null,
      completedAt: stepProgress?.completedAt || null
    });
  } catch (error) {
    console.error('Error fetching step:', error);
    res.status(500).json({ error: 'Failed to fetch step details' });
  }
});

// Add endpoint to start a step
app.post('/api/steps/:stepId/start', async (req, res) => {
  const { stepId } = req.params;
  const { userId } = req.body;
  
  try {
    const stepProgress = await prisma.stepProgress.upsert({
      where: {
        userId_stepId: {
          userId,
          stepId: parseInt(stepId)
        }
      },
      update: {
        startedAt: new Date(),
        status: 'IN_PROGRESS'
      },
      create: {
        userId,
        stepId: parseInt(stepId),
        startedAt: new Date(),
        status: 'IN_PROGRESS'
      }
    });

    // Create a notification with stepId
    await prisma.notification.create({
      data: {
        userId,
        type: 'info',
        message: `You've started step ${stepId}. Good luck!`,
        date: new Date(),
        stepId: parseInt(stepId) // Add the stepId to the notification
      }
    });
    
    res.status(200).json(stepProgress);
  } catch (error) {
    console.error('Error starting step:', error);
    res.status(500).json({ error: 'Failed to start step' });
  }
});

// Helper function to parse duration strings
function parseDuration(timeframe) {
  const number = parseInt(timeframe);
  if (timeframe.includes('week')) {
    return number * 7 * 24 * 60 * 60 * 1000;
  } else if (timeframe.includes('month')) {
    return number * 30 * 24 * 60 * 60 * 1000;
  } else if (timeframe.includes('day')) {
    return number * 24 * 60 * 60 * 1000;
  }
  return 14 * 24 * 60 * 60 * 1000; // Default to 2 weeks
}

// Get a specific user
app.get('/api/users/:id', async (req, res) => {
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

// Update user preferences
app.put('/api/users/:id/preferences', async (req, res) => {
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
});

// Add this endpoint
app.post('/api/create-subscription', async (req, res) => {
  const { priceId, userId, paymentMethod } = req.body;

  try {
    // Get or create customer
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethod,
        invoice_settings: {
          default_payment_method: paymentMethod,
        },
      });
      
      stripeCustomerId = customer.id;
      
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    if (!subscription.latest_invoice?.payment_intent?.client_secret) {
      throw new Error('No client secret found in subscription response');
    }

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error.message
    });
  }
});

// Regular middleware for parsed JSON bodies
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Webhook endpoint with raw body
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Construct event from raw body
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
    
    console.log('Webhook event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Processing checkout session:', session.id);

        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          await prisma.subscription.create({
            data: {
              stripeSubId: subscription.id,
              userId: session.metadata.userId,
              status: subscription.status,
              plan: subscription.items.data[0].price.nickname || 'default',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              active: true
            }
          });
          
          console.log('Created subscription record for user:', session.metadata.userId);
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        await prisma.subscription.update({
          where: { stripeSubId: updatedSubscription.id },
          data: {
            status: updatedSubscription.status,
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
            active: updatedSubscription.status === 'active'
          }
        });
        console.log('Updated subscription:', updatedSubscription.id);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await prisma.subscription.update({
          where: { stripeSubId: deletedSubscription.id },
          data: {
            status: 'canceled',
            active: false,
            cancelAtPeriodEnd: false
          }
        });
        console.log('Marked subscription as canceled:', deletedSubscription.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Add this endpoint to handle subscription cancellation
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Get user and subscription details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription?.stripeSubId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end instead of immediately
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubId,
      { cancel_at_period_end: true }
    );

    // Update subscription status in database
    await prisma.subscription.update({
      where: { stripeSubId: user.subscription.stripeSubId },
      data: { 
        status: 'canceling',
        cancelAtPeriodEnd: true
      }
    });

    res.json({ 
      message: 'Subscription will be canceled at the end of the billing period',
      cancelDate: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    });
  }
});

// Add this endpoint after your other endpoints
app.get('/api/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching subscription for userId:', userId);

    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId,
        active: true
      }
    });

    console.log('Database query result:', subscription);

    if (!subscription) {
      return res.status(404).json({ 
        error: 'No active subscription found',
        userId 
      });
    }

    const response = {
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    };

    console.log('Sending subscription response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription details',
      details: error.message,
      userId: req.params.userId
    });
  }
});

// Update the create-checkout-session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, email, priceId, subscription } = req.body;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Get or create customer
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { userId }
      });
      
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });
      
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: subscription ? 'subscription' : 'payment',
      success_url: `${FRONTEND_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing`,
      metadata: {
        userId,
        subscription: subscription.toString(),
        priceId
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Start Server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 