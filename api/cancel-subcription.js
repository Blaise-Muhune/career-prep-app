
import { stripe } from './config/stripe.js';
import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
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
  }     