"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { auth } from "@/firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import axios from "axios"
import { loadStripe } from "@stripe/stripe-js"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type PricingSwitchProps = {
  onSwitch: (value: string) => void
}

type PricingCardProps = {
  user: any
  handleCheckout: any
  priceIdMonthly: any
  priceIdYearly: any
  isYearly?: boolean
  title: string
  monthlyPrice?: number
  yearlyPrice?: number
  description: string
  features: string[]
  actionLabel: string
  popular?: boolean
  exclusive?: boolean
}

const PricingHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-lg">{subtitle}</p>
    </div>
  )
  
  const PricingSwitch = ({ onSwitch }: PricingSwitchProps) => (
    <div className="flex justify-center mt-8">
      <Tabs defaultValue="0" className="w-40" onValueChange={onSwitch}>
        <TabsList>
          <TabsTrigger value="0" className="text-base">Monthly</TabsTrigger>
          <TabsTrigger value="1" className="text-base">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
  
  const PricingCard = ({ user, handleCheckout, isYearly, title, priceIdMonthly, priceIdYearly, monthlyPrice, yearlyPrice, description, features, actionLabel, popular, exclusive }: PricingCardProps) => {
    const router = useRouter();
    
    return (
      <Card
        className={cn(
          "w-full md:w-[350px] flex flex-col justify-between transition-all duration-200",
          {
            "border-primary shadow-lg": popular,
            "hover:border-primary/50": !popular,
            "bg-gradient-to-b from-background to-primary/5": exclusive
          }
        )}
      >
        <div>
          <CardHeader className="space-y-2">
            {popular && (
              <div className="bg-primary/10 text-primary text-sm font-medium py-1 px-3 rounded-full w-fit">
                Most Popular
              </div>
            )}
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">
                {yearlyPrice && isYearly ? `$${yearlyPrice}` : monthlyPrice ? `$${monthlyPrice}` : "Custom"}
              </span>
              {(yearlyPrice || monthlyPrice) && (
                <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
              )}
            </div>
            <CardDescription className="text-base">{description}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </CardContent>
        </div>
  
        <CardFooter className="pt-6">
          <Button
            className="w-full"
            size="lg"
            variant={popular ? "default" : "outline"}
            onClick={() => {
              if (user?.uid) {
                handleCheckout(isYearly ? priceIdYearly : priceIdMonthly, true)
              } else {
                toast("Please login or sign up to purchase", {
                  description: "You must be logged in to make a purchase",
                  action: {
                    label: "Sign Up",
                    onClick: () => router.push("/auth"),
                  },
                })
              }
            }}
          >
            {actionLabel}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  export default function Pricing() {
    const [isYearly, setIsYearly] = useState<boolean>(false)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const togglePricingPeriod = (value: string) => setIsYearly(parseInt(value) === 1)
    const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user)
        setLoading(false)
      })

      setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!))

      return () => unsubscribe()
    }, [])

  const handleCheckout = async (priceId: string, subscription: boolean) => {
    try {
      if (!user) {
        toast.error('Please log in to continue');
        router.push('/auth');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      console.log('Creating checkout session with:', {
        userId: user.uid,
        email: user.email,
        priceId,
        subscription
      });

      const { data } = await axios.post(`${API_BASE_URL}/api/checkout`, {
        userId: user.uid,
        email: user.email,
        priceId,
        subscription
      });

      console.log('Checkout session response:', data);

      if (data.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe not initialized');
        }

        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          console.error('Stripe redirect error:', error);
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error during checkout:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'Error during checkout. Please try again.');
    }
  };

  const plans = [
    {
      title: "Basic",
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      description: "Essential career planning tools",
      features: [
        "Personalized career roadmap",
        "Basic skill tracking",
        "Task management system",
        "Progress tracking dashboard",
        "Career step guidance",
        "Basic notifications"
      ],
      priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_MONTHLY,
      priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_YEARLY,
      actionLabel: "Get Started with Basic",
    },
    {
      title: "Pro",
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      description: "Advanced career development tools",
      features: [
        "All Basic features",
        "AI-powered career analysis",
        "Detailed progress breakdown",
        "Advanced skill assessment",
        "Structured learning paths",
        "Priority task recommendations",
        "Custom career milestones",
        "Advanced progress analytics"
      ],
      actionLabel: "Get Started with Pro",
      priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_MONTHLY,
      priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_YEARLY,
      popular: true,
    },
    {
      title: "Enterprise",
      description: "Complete career development platform",
      features: [
        "All Pro features",
        "Team progress tracking",
        "Bulk user management",
        "Custom career paths",
        "Organization-specific metrics",
        "Advanced analytics dashboard",
        "Team skill mapping",
        "Custom notification system",
        "API access for integration"
      ],
      actionLabel: "Contact Sales",
      priceIdMonthly: 'custom',
      priceIdYearly: 'custom',
      exclusive: true,
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      Loading...
    </div>
  }

  return (
    <div className="container mx-auto px-4 py-16 space-y-12">
      <PricingHeader 
        title="Choose Your Career Journey" 
        subtitle="Invest in your future with our flexible pricing plans" 
      />
      <PricingSwitch onSwitch={togglePricingPeriod} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
        {plans.map((plan) => (
          <PricingCard 
            key={plan.title} 
            user={user} 
            handleCheckout={handleCheckout} 
            {...plan} 
            isYearly={isYearly} 
          />
        ))}
      </div>
    </div>
  )
}