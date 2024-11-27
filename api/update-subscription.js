import { stripe } from './config/stripe.js';
import { prisma } from './config/prisma.js';

export default async function handler(req, res) {
  const { userId, planId } = req.body;

  try {
    // Get user and current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription?.stripeSubId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Update the subscription with new price
    const subscription = await stripe.subscriptions.retrieve(
      user.subscription.stripeSubId
    );

    await stripe.subscriptions.update(user.subscription.stripeSubId, {
      items: [{
        id: subscription.items.data[0].id,
        price: planId,
      }],
      proration_behavior: 'always_invoice',
    });

    // Update subscription in database
    const updatedSubscription = await prisma.subscription.update({
      where: { stripeSubId: user.subscription.stripeSubId },
      data: {
        plan: planId,
        status: 'active',
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      message: 'Subscription updated successfully',
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      error: 'Failed to update subscription',
      details: error.message
    });
  }
}
