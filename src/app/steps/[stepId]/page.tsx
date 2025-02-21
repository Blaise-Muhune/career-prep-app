'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/firebaseConfig";
import { Clock, ArrowLeft, PlayCircle, CheckCircle, AlertTriangle, Timer, ExternalLink, BookOpen, Video, Headphones, Book, GraduationCap, Tag, Folder, Code, Target, Users, Award, Zap } from 'lucide-react';
import { startStep, completeStep, resetStep } from '@/app/lib/steps';
import { toast } from 'sonner';
import * as React from 'react';
import { parseISO } from 'date-fns';

interface Resource {
  id: number;
  name: string;
  url: string | null;
  description: string;
  type: string;
  provider: string;
  level: string;
  aiRelevance: string;
  timeCommitment: string;
  category: string;
  tags: string;
  isFree: boolean;
  isPremium: boolean;
}

interface Step {
  id: number;
  title: string;
  description: string;
  urgency: string;
  priority: string;
  skillType: string;
  category: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  timelineProgress: number;
  startedAt: string | null;
  completedAt: string | null;
  successMetrics: string[];
  resources: Resource[];
  timeframe: string;
}

export default function StepPage() {
  const router = useRouter();
  const params = useParams();
  const [stepData, setStepData] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStepData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No current user found, redirecting to auth');
        router.push('/auth');
        return;
      }

      if (!params?.stepId) {
        console.error('No step ID found');
        toast.error('Invalid step ID. Redirecting to steps page...');
        setTimeout(() => router.push('/steps'), 2000);
        return;
      }

      // First, get the latest career analysis to ensure the step exists
      const analysisResponse = await fetch(`/api/career-analysis?userId=${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!analysisResponse.ok) {
        console.error('Failed to fetch career analysis');
        toast.error('Failed to load step data. Redirecting to steps page...');
        setTimeout(() => router.push('/steps'), 2000);
        return;
      }

      const analyses = await analysisResponse.json();
      if (!analyses || analyses.length === 0) {
        console.error('No career analysis found');
        toast.error('No career analysis found. Redirecting to steps page...');
        setTimeout(() => router.push('/steps'), 2000);
        return;
      }

      // Then fetch the specific step data
      const stepResponse = await fetch(`/api/steps/${params.stepId}?userId=${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!stepResponse.ok) {
        console.error('Failed to fetch step data:', await stepResponse.text());
        toast.error('Failed to load step data. Redirecting to steps page...');
        setTimeout(() => router.push('/steps'), 2000);
        return;
      }

      const stepData = await stepResponse.json();
      if (!stepData || !stepData.id) {
        console.error('Invalid step data received');
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
  }, [params?.stepId]);

  const handleToggleStep = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !params?.stepId || !stepData) return;
    
    setIsLoading(true);
    try {
      if (stepData.status === 'NOT_STARTED') {
        await startStep(parseInt(params.stepId as string), currentUser.uid);
        setStepData(prev => prev ? {
          ...prev,
          status: 'IN_PROGRESS',
          startedAt: new Date().toISOString()
        } : null);
        toast.success('Step started successfully!');
      } else if (stepData.status === 'IN_PROGRESS') {
        await resetStep(parseInt(params.stepId as string), currentUser.uid);
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
    if (!currentUser || !params?.stepId || !stepData) return;
    
    setIsLoading(true);
    try {
      await completeStep(parseInt(params.stepId as string), currentUser.uid);
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
      case 'certification':
        return <Award className="h-5 w-5" />;
      case 'project':
        return <Code className="h-5 w-5" />;
      case 'community':
        return <Users className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const parseDuration = (timeframe: string): number => {
    // Handle the urgency format from the API
    if (timeframe.includes('immediate')) {
      return 6 * 30 * 24 * 60 * 60 * 1000; // 6 months
    } else if (timeframe.includes('near-term')) {
      return 12 * 30 * 24 * 60 * 60 * 1000; // 12 months
    } else if (timeframe.includes('future')) {
      return 24 * 30 * 24 * 60 * 60 * 1000; // 24 months
    }

    // Try to extract numbers from the string
    const numbers = timeframe.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const months = parseInt(numbers[numbers.length - 1]);
      if (!isNaN(months)) {
        return months * 30 * 24 * 60 * 60 * 1000; // Convert months to milliseconds
      }
    }

    // Default fallback
    return 6 * 30 * 24 * 60 * 60 * 1000; // Default to 6 months
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
      <div className="container mx-auto p-4">
        <Button 
          variant="outline"
          onClick={() => router.push('/steps')}
          className="mb-8 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Steps
        </Button>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-lg font-medium">Loading step details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stepData) {
    return (
      <div className="container mx-auto p-4">
        <Button 
          variant="outline"
          onClick={() => router.push('/steps')}
          className="mb-8 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Steps
        </Button>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-medium">Step not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="outline"
        onClick={() => router.push('/steps')}
        className="mb-8 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Steps
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <Card className="bg-gradient-to-br from-background to-accent/20 border-none shadow-lg">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-bold">{stepData.title}</CardTitle>
                  <CardDescription className="text-lg">{stepData.description}</CardDescription>
                </div>
                <Badge className={getPriorityColor(stepData.priority)}>
                  {stepData.priority.toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {stepData.timeframe}
                </div>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {stepData.category}
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {stepData.skillType}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Section */}
                <div className="space-y-6">
                  {stepData.status !== 'NOT_STARTED' && (
                    <div className="flex flex-col items-center justify-center p-4">
                      {stepData.status === 'COMPLETED' ? (
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                              className="text-muted stroke-current"
                              strokeWidth="8"
                              fill="transparent"
                              r="42"
                              cx="50"
                              cy="50"
                            />
                            <circle
                              className="text-green-500 stroke-current"
                              strokeWidth="8"
                              strokeLinecap="round"
                              fill="transparent"
                              r="42"
                              cx="50"
                              cy="50"
                              style={{
                                strokeDasharray: `${2 * Math.PI * 42}`,
                                strokeDashoffset: "0",
                                transition: "stroke-dashoffset 1s ease-in-out",
                              }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                          </div>
                        </div>
                      ) : stepData.startedAt ? (
                        (() => {
                          const startDate = parseISO(stepData.startedAt!);
                          const duration = parseDuration(stepData.timeframe);
                          const now = new Date();
                          const elapsed = now.getTime() - startDate.getTime();
                          const progress = Math.min((elapsed / duration) * 100, 100);
                          
                          const circumference = 2 * Math.PI * 42;
                          const offset = circumference - (progress / 100) * circumference;
                          
                          return (
                            <div className="relative w-32 h-32">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                  className="text-muted stroke-current"
                                  strokeWidth="8"
                                  fill="transparent"
                                  r="42"
                                  cx="50"
                                  cy="50"
                                />
                                <circle
                                  className="text-blue-500 stroke-current"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  fill="transparent"
                                  r="42"
                                  cx="50"
                                  cy="50"
                                  style={{
                                    strokeDasharray: `${circumference}`,
                                    strokeDashoffset: `${offset}`,
                                    transition: "stroke-dashoffset 1s ease-in-out",
                                  }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {stepData.timeframe}
                                </span>
                              </div>
                            </div>
                          );
                        })()
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Timeline</h3>
                  <div className="space-y-2">
                    {stepData.startedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Started {new Date(stepData.startedAt).toLocaleDateString()}
                      </div>
                    )}
                    {stepData.completedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Completed {new Date(stepData.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Success Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Success Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stepData.successMetrics.map((metric, index) => (
                      <div 
                        key={index}
                        className="p-3 rounded-lg border bg-accent/10 flex items-start gap-3"
                      >
                        <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {renderActionButton()}
              </div>
            </CardFooter>
          </Card>

          {/* Resources Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Learning Resources
              </CardTitle>
              <CardDescription>
                Curated materials to help you complete this step successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {stepData.resources.map((resource, index) => (
                  <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="font-semibold line-clamp-1">{resource.name}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {resource.description}
                              </p>
                            </div>
                            {resource.url && (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0"
                              >
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {resource.provider}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {resource.level}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {resource.timeCommitment}
                            </Badge>
                            {resource.isFree && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">
                                Free
                              </Badge>
                            )}
                            {resource.isPremium && (
                              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 text-xs">
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="bg-gradient-to-br from-background to-accent/20 border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Step Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  stepData.status === 'COMPLETED' ? 'bg-green-500/10' :
                  stepData.status === 'IN_PROGRESS' ? 'bg-blue-500/10' :
                  'bg-yellow-500/10'
                }`}>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(stepData.status)}
                    <div>
                      <p className="font-medium">{stepData.status.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {stepData.status === 'COMPLETED' ? 'Great job!' :
                         stepData.status === 'IN_PROGRESS' ? 'Keep going!' :
                         'Ready to start?'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-accent/10">
                  <p className="text-sm">Break down the step into smaller tasks</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10">
                  <p className="text-sm">Track your progress regularly</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10">
                  <p className="text-sm">Use the provided resources effectively</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}