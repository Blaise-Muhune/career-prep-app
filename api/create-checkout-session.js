import express from 'express';
import { stripe } from '../config/stripe.js';
import { prisma } from '../config/prisma.js';

const router = express.Router();


  // Regular middleware for parsed JSON bodies
router.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') {
      next();
    } else {
      express.json()(req, res, next);
    }
  });
  
  // Webhook endpoint with raw body

  
  // Add this endpoint to handle subscription cancellation
  
  // Update the create-checkout-session endpoint
router.post('/', async (req, res) => {
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
  

export const checkoutRouter = router; 