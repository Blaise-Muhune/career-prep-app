'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Check, Sparkles, Building, Rocket } from 'lucide-react'
import { Elements } from '@stripe/stripe-js';
import { stripePromise } from '@/lib/stripe';
import { auth } from "@/firebaseConfig";
import axios from 'axios';

const subscriptionTiers = [
  {
    name: 'Basic',
    price: '$9.99/month',
    description: 'Essential career planning tools',
    icon: Rocket,
    features: [
      'Personalized career roadmap',
      'Basic skill tracking',
      'Task management system',
      'Progress tracking dashboard',
      'Career step guidance',
      'Basic notifications',
    ],
    priceId: 'price_XXXXX',
  },
  {
    name: 'Pro',
    price: '$19.99/month',
    description: 'Advanced career development tools',
    icon: Sparkles,
    features: [
      'All Basic features',
      'AI-powered career analysis',
      'Detailed progress breakdown',
      'Advanced skill assessment',
      'Structured learning paths',
      'Priority task recommendations',
      'Custom career milestones',
      'Advanced progress analytics',
    ],
    highlighted: true,
    priceId: 'price_YYYYY',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Complete career development platform',
    icon: Building,
    features: [
      'All Pro features',
      'Team progress tracking',
      'Bulk user management',
      'Custom career paths',
      'Organization-specific metrics',
      'Advanced analytics dashboard',
      'Team skill mapping',
      'Custom notification system',
      'API access for integration',
    ],
    priceId: 'price_ZZZZZ',
  },
]

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const router = useRouter();

  const handleSubscribe = async (tier) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth');
        return;
      }

      // First create a payment method
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement('card'),
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create subscription with payment method
      const response = await axios.post('/api/create-subscription', {
        priceId: tier.priceId,
        userId: user.uid,
        paymentMethod: paymentMethod.id,
      });

      const { clientSecret } = response.data;

      // Confirm the payment
      const { error } = await stripe.confirmCardPayment(clientSecret);

      if (error) {
        throw new Error(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Choose Your Career Journey</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get personalized guidance and tools to achieve your dream job. Track your progress, manage tasks, and grow your career.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {subscriptionTiers.map((tier) => (
          <Card 
            key={tier.name} 
            className={`flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200 
              ${tier.highlighted ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''}`}
          >
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <tier.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{tier.name}</CardTitle>
              </div>
              <div className="space-y-2">
                <CardDescription className="text-3xl font-bold">{tier.price}</CardDescription>
                <CardDescription>{tier.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-6">
              <Button 
                className="w-full" 
                variant={tier.highlighted ? "default" : "outline"}
                size="lg"
                onClick={() => handleSubscribe(tier)}
                disabled={loading}
              >
                {loading ? 'Processing...' : tier.name === 'Enterprise' ? 'Contact Sales' : `Get Started with ${tier.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.
        </p>
        <p className="text-xs text-muted-foreground">
          Cancel anytime. Your career progress and data will always be saved.
        </p>
      </div>
    </div>
  )
}