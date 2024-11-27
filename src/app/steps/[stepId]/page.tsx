'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/firebaseConfig";
import { Clock, Calendar, ArrowLeft, PlayCircle, CheckCircle, AlertTriangle, Timer } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  timeframe: string;
  priority: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  timelineProgress: number;
  startedAt: string | null;
  completedAt: string | null;
}

export default function StepDetailPage() {
  const router = useRouter();
  const { stepId } = useParams();
  const [stepData, setStepData] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStepData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://career-prep-app.vercel.app';
        const response = await axios.get(`${API_BASE_URL}/api/steps/${stepId}`, {
          params: { userId: currentUser.uid }
        });
        setStepData(response.data);
      } catch (err) {
        console.error('Error fetching step data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStepData();
  }, [stepId, router]);

  const handleStartStep = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push('/auth');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://career-prep-app.vercel.app';
      await axios.post(`${API_BASE_URL}/api/start-step/${stepId}`, {
        userId: currentUser.uid
      });
      
      // Refresh step data after starting
      const response = await axios.get(`${API_BASE_URL}/api/steps/${stepId}`, {
        params: { userId: currentUser.uid }
      });
      setStepData(response.data);
    } catch (error) {
      console.error('Error starting step:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <AlertTriangle className="h-5 w-5" />;
      case 'IN_PROGRESS':
        return <Timer className="h-5 w-5" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!stepData) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-xl font-semibold text-red-500">Step not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="hover:bg-background"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Steps
            </Button>
          </div>
          
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{stepData.title}</CardTitle>
              <CardDescription className="text-base">{stepData.description}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`px-4 py-2 ${getPriorityColor(stepData.priority)}`}>
                {stepData.priority.toUpperCase()} PRIORITY
              </Badge>
              <Badge 
                variant="outline" 
                className="flex items-center gap-2"
              >
                {getStatusIcon(stepData.status)}
                {stepData.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="bg-accent/50 p-6 rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Timeline Progress
            </h3>
            <Progress 
              value={stepData.timelineProgress} 
              className="h-3 mb-2"
            />
            <p className="text-center text-sm text-muted-foreground mt-2">
              {stepData.status === 'NOT_STARTED' ? 'Not Started' :
               stepData.status === 'COMPLETED' ? 'Completed' :
               `${stepData.timelineProgress}% of time elapsed`}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Estimated Timeframe
              </h3>
              <p className="text-muted-foreground">{stepData.timeframe}</p>
            </div>

            {stepData.startedAt && (
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  Started On
                </h3>
                <p className="text-muted-foreground">
                  {new Date(stepData.startedAt).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="border-t pt-6">
          <div className="w-full flex justify-end">
            {stepData.status === 'NOT_STARTED' ? (
              <Button 
                onClick={handleStartStep}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Start Step
              </Button>
            ) : stepData.status === 'IN_PROGRESS' ? (
              <Button 
                className="bg-green-500 hover:bg-green-600"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Mark as Complete
              </Button>
            ) : (
              <Badge 
                variant="default" 
                className="px-4 py-2 text-base flex items-center gap-2 bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-5 w-5" />
                Completed
              </Badge>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}