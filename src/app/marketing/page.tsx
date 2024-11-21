'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowRight, Rocket, Target, Users, Sparkles, Star, Brain, Trophy, ChartLine } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const features = [
  {
    title: "Personalized Career Roadmap",
    description: "Get a custom-tailored path to your dream job with actionable steps and milestones.",
    icon: Target
  },
  {
    title: "AI-Powered Analysis",
    description: "Receive intelligent insights and recommendations based on your career goals and progress.",
    icon: Sparkles
  },
  {
    title: "Progress Tracking",
    description: "Monitor your journey with detailed analytics and achievement tracking.",
    icon: Rocket
  },
  {
    title: "Community Support",
    description: "Connect with others on similar career paths and share experiences.",
    icon: Users
  }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Software Engineer",
    company: "Google",
    content: "This platform helped me transition from junior to senior developer in just 18 months.",
    avatar: "/avatars/sarah.jpg"
  },
  {
    name: "Michael Chen",
    role: "Product Manager",
    company: "Microsoft",
    content: "The AI-powered insights were game-changing for my career progression.",
    avatar: "/avatars/michael.jpg"
  },
  {
    name: "Emma Davis",
    role: "UX Designer",
    company: "Apple",
    content: "I landed my dream job thanks to the structured career path and mentorship.",
    avatar: "/avatars/emma.jpg"
  }
];

const stats = [
  { label: "Active Users", value: "50K+" },
  { label: "Success Stories", value: "10K+" },
  { label: "Career Paths", value: "100+" },
  { label: "Satisfaction Rate", value: "98%" }
];

function AnimatedSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function ParallaxSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}

export default function MarketingPage() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Section - Full screen with better centering */}
      <div className="min-h-[100vh] flex items-center justify-center bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <motion.h1 
              className="text-5xl sm:text-6xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Your Career Journey, <span className="text-primary">Reimagined</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Transform your career aspirations into reality with our AI-powered career development platform.
            </motion.p>
            <motion.div 
              className="flex justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Button asChild size="lg" className="text-lg">
                <Link href="/auth">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg">
                <Link href="/subscription">View Pricing</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section - Centered with max-width */}
      <section className="py-32 bg-background">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-16">
              Everything you need to succeed
            </h2>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature) => (
              <AnimatedSection key={feature.title}>
                <Card className="hover:shadow-lg transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{feature.title}</CardTitle>
                    </div>
                    <CardDescription className="text-lg mt-4">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section - Full width with centered content */}
      <ParallaxSection>
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat) => (
                <AnimatedSection key={stat.label}>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold">{stat.value}</div>
                    <div className="text-primary-foreground/80">{stat.label}</div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </ParallaxSection>

      {/* Testimonials Section - Centered with max-width */}
      <section className="py-32 bg-background">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-16">
              Success Stories
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <AnimatedSection key={testimonial.name}>
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Star className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{testimonial.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role} at {testimonial.company}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{testimonial.content}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights - Black section with centered content */}
      <section className="py-32 bg-black text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-32 max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold">AI-Powered Career Analysis</h2>
                  <p className="text-lg text-gray-300">
                    Our advanced AI algorithms analyze your skills, experience, and goals to provide
                    personalized career recommendations and insights.
                  </p>
                </div>
                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-primary/50 p-8">
                    <Brain className="w-full h-full text-white/90" />
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="relative order-2 md:order-1">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-primary/50 p-8">
                    <Trophy className="w-full h-full text-white/90" />
                  </div>
                </div>
                <div className="space-y-6 order-1 md:order-2">
                  <h2 className="text-4xl font-bold">Achievement Tracking</h2>
                  <p className="text-lg text-gray-300">
                    Set goals, track milestones, and celebrate your progress with our comprehensive
                    achievement system.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold">Real-time Progress Analytics</h2>
                  <p className="text-lg text-gray-300">
                    Visualize your career growth with detailed analytics and insights that help you
                    stay on track.
                  </p>
                </div>
                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-primary/50 p-8">
                    <ChartLine className="w-full h-full text-white/90" />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section - Centered with max-width */}
      <section className="py-32 bg-background">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-5xl mx-auto">
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="flex flex-col items-center text-center p-8 sm:p-16 space-y-6">
                  <h2 className="text-4xl font-bold">Ready to Transform Your Career?</h2>
                  <p className="text-primary-foreground/90 text-lg max-w-2xl">
                    Join thousands of professionals who are already mapping their path to success.
                    Start your journey today.
                  </p>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    asChild
                    className="text-lg mt-8"
                  >
                    <Link href="/auth">
                      Begin Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
} 