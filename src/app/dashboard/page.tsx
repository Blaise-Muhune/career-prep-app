'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { auth } from "@/firebaseConfig"; // Import Firebase auth
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Bell, Settings, User, ListChecks, ChevronRight, LogOut } from 'lucide-react';
import { signOut } from "firebase/auth"; // Add this import
import { cn } from "@/lib/utils";

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
  // Round the values to avoid floating point issues
  const preexistingWidth = Math.round(preexisting);
  const appProgressWidth = Math.round(appProgress);

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div 
        className="absolute left-0 h-full bg-blue-500 transition-all duration-300"
        style={{ width: `${preexistingWidth}%` }}
      />
      <div 
        className="absolute h-full bg-green-500 transition-all duration-300"
        style={{ 
          left: `${preexistingWidth}%`,
          width: `${appProgressWidth}%` 
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [careerAnalysis, setCareerAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/auth');
          return;
        }

        const userId = user.uid;
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        
        const [userResponse, analysisResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/profile/userProfile`, {
            params: { userId },
            withCredentials: true,
          }),
          axios.post(`${API_BASE_URL}/api/profile/structure-profile`, {
            userId
          }, {
            withCredentials: true,
          })
        ]);

        setUserData(userResponse.data);
        setCareerAnalysis(analysisResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data.');
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4">Loading your dashboard...</p>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Welcome back, {userData?.name}!</h1>
              <p className="text-muted-foreground mt-2">Let&apos;s continue your journey to becoming a {userData?.dreamJob}</p>
            </div>
            
            {/* Notifications Button - Made to stand out */}
            <Button 
              asChild
              variant="outline"
              className="relative bg-background hover:bg-accent transition-all duration-200 ml-auto"
              size="lg"
            >
              <Link href="/notifications" className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
                {userData?.upcomingTasks.filter(task => !task.completed).length > 0 && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                    {userData.upcomingTasks.filter(task => !task.completed).length}
                  </span>
                )}
              </Link>
            </Button>
          </div>

          {/* Main Content Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ListChecks className="h-6 w-6 text-primary" />
                  </div>
                  Your Dream Job Progress
                </CardTitle>
                <CardDescription>Track your journey to becoming a {userData?.dreamJob}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Progress Legend */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Preexisting Experience ({Math.round(careerAnalysis?.progressBreakdown?.preexistingExperience || 0)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>App Progress ({Math.round(careerAnalysis?.progressBreakdown?.appProgress || 0)}%)</span>
                    </div>
                  </div>

                  {/* Combined Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total Progress</span>
                      <span className="font-medium">
                        {Math.round(careerAnalysis?.progressBreakdown?.totalProgress || 0)}%
                      </span>
                    </div>
                    <DualProgressBar 
                      preexisting={careerAnalysis?.progressBreakdown?.preexistingExperience || 0}
                      appProgress={careerAnalysis?.progressBreakdown?.appProgress || 0}
                      className="h-3"
                    />
                  </div>

                  {/* Analysis Section */}
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {careerAnalysis?.analysis || 'Analysis not available.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ChevronRight className="h-6 w-6 text-primary" />
                  </div>
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {careerAnalysis?.nextSteps.map((step, index) => (
                    <Link href={`/steps/${encodeURIComponent(step.step)}`} key={index}>
                      <li className="p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors duration-200 cursor-pointer">
                        <p className="font-medium">{step.step}</p>
                        <p className="text-sm text-muted-foreground mt-1">{step.reason}</p>
                      </li>
                    </Link>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access frequently used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Button 
                  asChild 
                  variant="outline"
                  className="h-auto py-6 flex flex-col gap-2 hover:bg-accent transition-colors duration-200"
                >
                  <Link href="/steps">
                    <ListChecks className="h-6 w-6 mb-2" />
                    <span className="font-semibold">Career Steps</span>
                    <span className="text-sm text-muted-foreground">View your career journey</span>
                  </Link>
                </Button>

                <Button 
                  asChild 
                  variant="outline"
                  className="h-auto py-6 flex flex-col gap-2 hover:bg-accent transition-colors duration-200"
                >
                  <Link href="/profile">
                    <User className="h-6 w-6 mb-2" />
                    <span className="font-semibold">Profile</span>
                    <span className="text-sm text-muted-foreground">Update your information</span>
                  </Link>
                </Button>

                <Button 
                  asChild 
                  variant="outline"
                  className="h-auto py-6 flex flex-col gap-2 hover:bg-accent transition-colors duration-200"
                >
                  <Link href="/settings">
                    <Settings className="h-6 w-6 mb-2" />
                    <span className="font-semibold">Settings</span>
                    <span className="text-sm text-muted-foreground">Customize your experience</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add this button wherever you want the logout to appear */}
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </>
      )}
    </div>
  );
}