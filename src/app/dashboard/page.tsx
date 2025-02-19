'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { auth } from "@/firebaseConfig"; // Import Firebase auth
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  Bell, Settings, User, ListChecks, ChevronRight, LogOut, 
  CheckCircle, Clock, Circle, Trophy, Target, Sparkles,
  GraduationCap, BookOpen, Rocket
} from 'lucide-react';
import { signOut } from "firebase/auth"; // Add this import
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

interface Task {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface UserData {
  name: string;
  dreamJob: string;
  overallProgress: number;
  upcomingTasks: Task[];
}

interface ProgressBreakdown {
  preexistingExperience: number;
  appProgress: number;
  totalProgress: number;
}

interface CareerAnalysis {
  progressBreakdown: ProgressBreakdown;
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

function DualProgressBar({ 
  preexisting, 
  appProgress, 
  className 
}: { 
  preexisting: number; 
  appProgress: number; 
  className?: string;
}) {
  // Ensure values are numbers and round them
  const preexistingWidth = Math.min(Math.round(preexisting || 0), 100);
  const appProgressWidth = Math.min(Math.round(appProgress || 0), 100 - preexistingWidth);
  const totalProgress = preexistingWidth + appProgressWidth;

  if (totalProgress === 0) {
    return (
      <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted flex items-center justify-center", className)}>
        <div className="h-0.5 w-full bg-gray-300 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      {/* Preexisting Experience Bar */}
      {preexistingWidth > 0 && (
        <div 
          className="absolute left-0 h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${preexistingWidth}%` }}
        />
      )}
      {/* App Progress Bar */}
      {appProgressWidth > 0 && (
        <div 
          className="absolute h-full bg-green-500 transition-all duration-300"
          style={{ 
            left: `${preexistingWidth}%`,
            width: `${appProgressWidth}%` 
          }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [careerAnalysis, setCareerAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Array<{
    id: number;
    title: string;
    description: string;
    status: string;
    progress: {
      status: string;
      startedAt: string | null;
      completedAt: string | null;
    };
  }>>([]);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/auth');
          return;
        }

        const userId = user.uid;
        
        try {
          // 1. First get user data
          const userResponse = await axios.get(`/api/get-user`, {
            params: { userId },
            withCredentials: true,
          });
          setUserData(userResponse.data);

          // 2. Then get career analysis which includes progress
          const analysisResponse = await axios.post('/api/structure-profile', {
            userId
          }, {
            withCredentials: true,
          });
          setCareerAnalysis(analysisResponse.data);

          // 3. Finally get steps
          try {
            const stepsResponse = await axios.get('/api/steps', {
              params: { userId },
              withCredentials: true,
            });
            
            if (Array.isArray(stepsResponse.data)) {
              setSteps(stepsResponse.data);
            } else {
              console.warn('Steps data is not an array:', stepsResponse.data);
              setSteps([]);
            }
          } catch (stepsError: any) {
            console.error('Error fetching steps:', stepsError.response?.data || stepsError.message);
            // Don't fail the whole dashboard if steps fail to load
            setSteps([]);
          }

        } catch (err: any) {
          console.error('Error in data fetching:', err.response?.data || err.message);
          // Set default values for failed requests
          setCareerAnalysis({
            progressBreakdown: {
              preexistingExperience: 0,
              appProgress: 0,
              totalProgress: 0
            },
            progressPercentage: 0,
            tasks: [],
            nextSteps: [],
            analysis: "Getting started with your career journey..."
          });
          setSteps([]);
          // Only show error if it's not a 404
          if (err.response?.status !== 404) {
            throw err;
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Don't render anything until mounted
  if (!mounted) return null;

  return (
    <div suppressHydrationWarning className="container mx-auto p-6 space-y-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary h-8 w-8" />
            </div>
            <p className="text-lg font-medium">Loading your career dashboard...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold flex items-center gap-3">
                Welcome back, {userData?.name}!
                <span className="text-primary">
                  <Trophy className="h-8 w-8" />
                </span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Let&apos;s continue your journey to becoming a{' '}
                <span className="text-primary font-medium">{userData?.dreamJob || 'your dream job'}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                asChild
                variant="outline"
                className="relative bg-background hover:bg-accent transition-all duration-200"
                size="lg"
              >
                <Link href="/notifications" className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                  {userData?.upcomingTasks && userData.upcomingTasks.filter((task: Task) => !task.completed).length > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {userData.upcomingTasks.filter((task: Task) => !task.completed).length}
                    </span>
                  )}
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleLogout}
                size="lg"
                className="flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Overview Card */}
            <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  Career Progress Overview
                </CardTitle>
                <CardDescription className="text-base">
                  Your journey to becoming a {userData?.dreamJob || 'professional'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Progress Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                      <div className="flex items-center gap-2 text-primary">
                        <GraduationCap className="h-5 w-5" />
                        <span className="font-medium">Experience</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {Math.round(careerAnalysis?.progressBreakdown?.preexistingExperience || 0)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                      <div className="flex items-center gap-2 text-primary">
                        <BookOpen className="h-5 w-5" />
                        <span className="font-medium">App Progress</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {Math.round(careerAnalysis?.progressBreakdown?.appProgress || 0)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Rocket className="h-5 w-5" />
                        <span className="font-medium">Total Progress</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {Math.round(careerAnalysis?.progressBreakdown?.totalProgress || 0)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-4">
                    <DualProgressBar 
                      preexisting={Number(careerAnalysis?.progressBreakdown?.preexistingExperience) || 0}
                      appProgress={Number(careerAnalysis?.progressBreakdown?.appProgress) || 0}
                      className="h-4"
                    />
                  </div>

                  {/* Analysis Section */}
                  <div className="p-6 rounded-lg bg-accent/30 border border-accent">
                    <p className="text-base leading-relaxed">
                      {careerAnalysis?.analysis || 'Analyzing your career progress...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Career Steps Card */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ListChecks className="h-6 w-6 text-primary" />
                  </div>
                  Career Steps
                </CardTitle>
                <CardDescription>Your next career milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <Link href={`/steps/${step.id}`} key={step.id}>
                      <div className="group relative p-4 rounded-lg bg-accent/50 hover:bg-accent/70 transition-all duration-200 cursor-pointer">
                        {/* Progress Line */}
                        {index < steps.length - 1 && (
                          <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-accent-foreground/20" />
                        )}
                        
                        <div className="relative flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {step.progress.status === 'COMPLETED' && (
                              <div className="p-1 rounded-full bg-green-500/20">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                            {step.progress.status === 'IN_PROGRESS' && (
                              <div className="p-1 rounded-full bg-blue-500/20">
                                <Clock className="h-5 w-5 text-blue-500" />
                              </div>
                            )}
                            {step.progress.status === 'NOT_STARTED' && (
                              <div className="p-1 rounded-full bg-muted">
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base group-hover:text-primary transition-colors">
                              {step.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {step.description}
                            </p>
                          </div>
                          
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              asChild 
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
            >
              <Link href="/steps">
                <ListChecks className="h-8 w-8 text-primary" />
                <span className="font-semibold text-lg">Career Steps</span>
                <span className="text-sm text-muted-foreground text-center">View and track your career journey</span>
              </Link>
            </Button>

            <Button 
              asChild 
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
            >
              <Link href="/profile">
                <User className="h-8 w-8 text-primary" />
                <span className="font-semibold text-lg">Profile</span>
                <span className="text-sm text-muted-foreground text-center">Update your career information</span>
              </Link>
            </Button>

            <Button 
              asChild 
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
            >
              <Link href="/settings">
                <Settings className="h-8 w-8 text-primary" />
                <span className="font-semibold text-lg">Settings</span>
                <span className="text-sm text-muted-foreground text-center">Customize your experience</span>
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}