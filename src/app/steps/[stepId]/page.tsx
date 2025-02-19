'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/firebaseConfig";
import { Clock, Calendar, ArrowLeft, PlayCircle, CheckCircle, AlertTriangle, Timer, ExternalLink, BookOpen, Video, Headphones, Book, GraduationCap, Tag } from 'lucide-react';
import { startStep, completeStep, resetStep } from '@/app/lib/steps';
import { toast } from 'sonner';
import * as React from 'react';

interface Resource {
  id: number;
  name: string;
  url: string | null;
  description: string;
  type: string;
  category: string;
  tags: string;
  isFree: boolean;
  isPremium: boolean;
}

interface Step {
  id: number;
  analysisId: number;
  title: string;
  description: string;
  timeframe: string;
  priority: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  timelineProgress: number;
  startedAt: string | null;
  completedAt: string | null;
  resources: Resource[];
}

interface PageProps {
  params: Promise<{
    stepId: string;
  }>;
}

export default function StepPage({ params }: PageProps) {
  const router = useRouter();
  const [stepData, setStepData] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { stepId } = React.use(params);

  const fetchStepData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No current user found, redirecting to auth');
        router.push('/auth');
        return;
      }

      // Use the dedicated steps API endpoint instead of career analysis
      const stepResponse = await fetch(`/api/steps/${stepId}?userId=${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!stepResponse.ok) {
        console.error('Failed to fetch step data');
        toast.error('Failed to load step data. Redirecting to steps page...');
        setTimeout(() => router.push('/steps'), 2000);
        return;
      }

      const stepData = await stepResponse.json();
      if (!stepData) {
        console.error('Step not found');
        toast.error('Step not found. Redirecting to steps page...');
        setTimeout(() => router.push('/steps'), 2000);
        return;
      }

      setStepData(stepData);
    } catch (error) {
      console.error('Error in fetchStepData:', error);
      toast.error('Failed to load step data. Redirecting to steps page...');
      setTimeout(() => router.push('/steps'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User authenticated, fetching step data');
        fetchStepData();
      } else {
        console.log('No user found, redirecting to auth');
        router.push('/auth');
      }
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, [stepId]);

  const handleToggleStep = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !stepId || !stepData) return;
    
    setIsLoading(true);
    try {
      if (stepData.status === 'NOT_STARTED') {
        await startStep(parseInt(stepId), currentUser.uid);
        setStepData(prev => prev ? {
          ...prev,
          status: 'IN_PROGRESS',
          startedAt: new Date().toISOString()
        } : null);
        toast.success('Step started successfully!');
      } else if (stepData.status === 'IN_PROGRESS') {
        await resetStep(parseInt(stepId), currentUser.uid);
        setStepData(prev => prev ? {
          ...prev,
          status: 'NOT_STARTED',
          startedAt: null
        } : null);
        toast.success('Step reset successfully!');
      }
    } catch (error) {
      console.error('Error toggling step:', error);
      toast.error('Failed to update step');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStep = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !stepId || !stepData) return;
    
    setIsLoading(true);
    try {
      await completeStep(parseInt(stepId), currentUser.uid);
      setStepData(prev => prev ? {
        ...prev,
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      } : null);
      toast.success('Step completed successfully!');
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Failed to complete step');
    } finally {
      setIsLoading(false);
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

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'podcast':
        return <Headphones className="h-5 w-5" />;
      case 'book':
        return <Book className="h-5 w-5" />;
      case 'course':
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const renderActionButton = () => {
    if (!stepData) return null;

    if (stepData.status === 'COMPLETED') {
      return (
        <Badge 
          variant="default" 
          className="px-4 py-2 text-base flex items-center gap-2 bg-green-500 hover:bg-green-600"
        >
          <CheckCircle className="h-5 w-5" />
          Completed
        </Badge>
      );
    }

    return (
      <div className="flex gap-4">
        <Button 
          onClick={handleToggleStep}
          disabled={isLoading}
          className={stepData.status === 'NOT_STARTED' ? 
            "bg-primary hover:bg-primary/90" : 
            "bg-yellow-500 hover:bg-yellow-600"}
          size="lg"
        >
          {stepData.status === 'NOT_STARTED' ? (
            <>
              <PlayCircle className="h-5 w-5 mr-2" />
              {isLoading ? 'Starting...' : 'Start Step'}
            </>
          ) : (
            <>
              <Timer className="h-5 w-5 mr-2" />
              {isLoading ? 'Updating...' : 'Started'}
            </>
          )}
        </Button>
        {stepData.status === 'IN_PROGRESS' && (
          <Button 
            onClick={handleCompleteStep}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600"
            size="lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            {isLoading ? 'Completing...' : 'Complete Step'}
          </Button>
        )}
      </div>
    );
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

          {/* Resources Section */}
          {stepData.resources && stepData.resources.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Learning Resources</h3>
              <div className="grid gap-4">
                {stepData.resources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{resource.name}</h4>
                            <div className="flex gap-2">
                              {resource.isFree && (
                                <Badge variant="secondary">Free</Badge>
                              )}
                              {resource.isPremium && (
                                <Badge variant="default">Premium</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resource.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {resource.category}
                            </span>
                          </div>
                          {resource.url && (
                            <Button
                              variant="link"
                              className="p-0 h-auto mt-2 text-primary"
                              asChild
                            >
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Access Resource
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-6">
          <div className="w-full flex justify-end">
            {renderActionButton()}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}