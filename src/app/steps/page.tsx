'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  Circle, 
  ArrowLeft, 
  RefreshCcw, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Target,
  ArrowUpRight
} from 'lucide-react'
import { auth } from "@/firebaseConfig"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

interface CareerAnalysis {
  progressPercentage: number;
  tasks: Array<{
    title: string;
    description: string;
    timeframe: string;
    priority: string;
  }>;
  nextSteps: Array<{
    step: string;
    reason: string;
  }>;
  analysis: string;
}

export default function StepsPage() {
  const [careerAnalysis, setCareerAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/auth');
          return;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        const response = await axios.post(`${API_BASE_URL}/api/career-analysis`, {
          userId: user.uid
        }, {
          withCredentials: true
        });

        setCareerAnalysis(response.data);
      } catch (error) {
        console.error("Error fetching career analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [router]);

  const handleStepClick = (index: number) => {
    router.push(`/steps/${index + 1}`);
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-red-500/10 text-red-500 border-red-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      low: "bg-green-500/10 text-green-500 border-green-500/20"
    };
    return (
      <Badge className={`${variants[priority as keyof typeof variants]} px-2 py-1`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading your career journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Your Career Journey</h1>
          <p className="text-muted-foreground mt-2">Track your progress and next steps</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Overall Progress
          </CardTitle>
          <CardDescription>Track your progress towards your dream job</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-accent/50 p-6 rounded-lg">
            <Progress 
              value={careerAnalysis?.progressPercentage} 
              className="h-3 mb-4" 
            />
            <p className="text-center font-semibold text-lg mb-4">
              {Math.round(careerAnalysis?.progressPercentage || 0)}% Complete
            </p>
            <p className="text-muted-foreground text-center">
              {careerAnalysis?.analysis}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 mb-8">
        <h2 className="text-2xl font-semibold">Career Steps</h2>
        {careerAnalysis?.tasks.map((task, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-all duration-200 group cursor-pointer"
            onClick={() => handleStepClick(index)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      {index === 0 ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground ml-11">{task.description}</p>
                  
                  <div className="flex items-center gap-4 mt-4 ml-11">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {task.timeframe}
                    </div>
                    {getPriorityBadge(task.priority)}
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="group-hover:translate-x-1 transition-transform"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Recommended Next Steps</h2>
          <Button 
            variant="outline"
            onClick={() => router.push('/steps/next-steps')}
            className="flex items-center gap-2"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {careerAnalysis?.nextSteps.slice(0, 4).map((step, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/steps/next/${index + 1}`)}
            >
              <CardContent className="p-6">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  {step.step}
                </h3>
                <p className="text-sm text-muted-foreground">{step.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button 
          onClick={() => router.push('/steps/refresh')}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>
    </div>
  );
}
