import express from 'express';
import { stripe } from '../config/stripe.js';
import { prisma } from '../config/prisma.js';

const router = express.Router();

router.post('/create-subscription', async (req, res) => {
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
  

router.post('/cancel-subscription', async (req, res) => {
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
router.get('/:userId', async (req, res) => {
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

export const subscriptionRouter = router; 