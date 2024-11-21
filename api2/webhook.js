import express from 'express';
import { stripe } from '../config/stripe.js';
import { prisma } from '../config/prisma.js';

const router = express.Router();

router.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
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

export const webhookRouter = router; 