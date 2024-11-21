"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Brain, Target, Users, Trophy, CheckCircle2 } from "lucide-react"

const guides = [
  {
    title: "Getting Started",
    description: "Essential steps to begin your career journey",
    icon: Target,
    steps: [
      {
        title: "Complete Your Profile",
        description: "Add your skills, experience, and career goals to get personalized recommendations.",
      },
      {
        title: "Take the Career Assessment",
        description: "Get AI-powered insights about your strengths and potential career paths.",
      },
      {
        title: "Review Your Roadmap",
        description: "Explore your personalized career development plan and milestones.",
      },
    ]
  },
  {
    title: "Using AI Analysis",
    description: "Make the most of our AI-powered features",
    icon: Brain,
    steps: [
      {
        title: "Regular Updates",
        description: "Keep your profile current to receive the most accurate career recommendations.",
      },
      {
        title: "Skill Gap Analysis",
        description: "Identify key skills needed for your target role and get learning resources.",
      },
      {
        title: "Progress Tracking",
        description: "Monitor your development with AI-generated insights and adjustments.",
      },
    ]
  },
  {
    title: "Achievement System",
    description: "Track and celebrate your progress",
    icon: Trophy,
    steps: [
      {
        title: "Set Milestones",
        description: "Break down your career goals into achievable milestones.",
      },
      {
        title: "Track Completion",
        description: "Mark tasks as complete and watch your progress grow.",
      },
      {
        title: "Earn Badges",
        description: "Get recognition for your achievements and skill development.",
      },
    ]
  },
  {
    title: "Community Features",
    description: "Connect and learn from others",
    icon: Users,
    steps: [
      {
        title: "Join Discussion Groups",
        description: "Connect with professionals in your field of interest.",
      },
      {
        title: "Share Experiences",
        description: "Learn from others' career journeys and share your own insights.",
      },
      {
        title: "Get Feedback",
        description: "Receive constructive feedback on your career progress.",
      },
    ]
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-16"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Quick Start Guide</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know to make the most of your career development journey
          </p>
        </motion.div>

        {/* Guide Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {guides.map((guide) => (
            <motion.div key={guide.title} variants={itemVariants}>
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <guide.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{guide.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {guide.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {guide.steps.map((step) => (
                      <div key={step.title} className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to Start Your Journey?</h2>
              <p className="text-primary-foreground/90">
                Apply these guidelines to make the most of your career development experience.
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                asChild
                className="mt-4"
              >
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
} 