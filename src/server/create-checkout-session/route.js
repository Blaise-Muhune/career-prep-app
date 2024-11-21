import express from 'express';
import Stripe from "stripe";
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: join(__dirname, '../../../.env') });

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

// Verify environment variables
const requiredEnvVars = ['STRIPE_SECRET_KEY', 'FRONTEND_URL', 'DATABASE_URL'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// Checkout endpoint
app.post('/api/payments/create-checkout-session', async (req, res) => {
  try {
    const { userId, email, priceId, subscription } = req.body;
    
    console.log('Creating checkout session with:', {
      userId,
      email,
      priceId,
      subscription,
      frontendUrl: process.env.FRONTEND_URL // Debug log
    });

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: "User not found" });
    }

    // Get or create Stripe customer
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

    // Create checkout session
    const sessionConfig = {
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, email, subscription: subscription.toString() },
      mode: subscription ? "subscription" : "payment",
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      allow_promotion_codes: subscription ? true : false,
    };

    console.log('Session config:', {
      ...sessionConfig,
      success_url: sessionConfig.success_url,
      cancel_url: sessionConfig.cancel_url
    });

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.json({ sessionId: session.id });
    
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({ 
      error: "Failed to create checkout session",
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});