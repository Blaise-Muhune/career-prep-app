
import { stripe } from './config/stripe.js';
import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
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
  }
  


