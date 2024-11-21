"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Sparkles, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { useSearchParams } from 'next/navigation'

export default function Success() {
  const [customerName, setCustomerName] = useState<string>('')
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Trigger confetti animation on mount
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timer = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    // Cleanup
    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        className="max-w-3xl w-full space-y-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3
              }}
              className="rounded-full bg-primary/10 p-3"
            >
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to the Journey! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            Your subscription has been successfully activated
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-center space-x-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "linear"
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-primary" />
                  </motion.div>
                ))}
              </div>
              <h2 className="text-2xl font-semibold">What's Next?</h2>
              <div className="grid gap-4 text-left">
                {[
                  "Complete your profile to personalize your experience",
                  "Explore our AI-powered career analysis tools",
                  "Set your first career milestone",
                  "Connect with our community"
                ].map((text, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="flex items-center space-x-3"
                  >
                    <Star className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{text}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <Button asChild size="lg" className="px-8">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Need help getting started? Check out our{' '}
            <Link href="/guide" className="text-primary hover:underline">
              quick start guide
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
} 