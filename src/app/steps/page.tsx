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
  ArrowUpRight,
  GraduationCap,
  BookOpen,
  Rocket,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { auth } from "@/firebaseConfig"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'

interface CareerAnalysis {
  progressPercentage: number;
  steps: Array<{
    id: number;
    analysisId: number;
    title: string;
    description: string;
    timeframe: string;
    priority: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    startedAt: string | null;
    progress: {
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      startedAt: string | null;
    };
    resources: Array<{
      name: string;
      url?: string;
      description: string;
      type: string;
      category: string;
      tags: string;
      isFree: boolean;
      isPremium: boolean;
    }>;
  }>;
  analysis: string;
  progressBreakdown: {
    preexistingExperience: number;
    appProgress: number;
    totalProgress: number;
  };
}

interface UserData {
  dreamJob?: string;
}

export default function StepsPage() {
  const [careerAnalysis, setCareerAnalysis] = useState<CareerAnalysis | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/auth');
          return;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://career-prep-app.vercel.app/';
        const response = await axios.post(`/api/career-analysis`, {
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

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500/10 text-red-500 border-red-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      low: "bg-green-500/10 text-green-500 border-green-500/20"
    };
    return colors[priority as keyof typeof colors];
  };

  const DualProgressBar = ({ preexisting, appProgress, className }: { 
    preexisting: number; 
    appProgress: number; 
    className?: string;
  }) => {
    const preexistingWidth = Math.min(Math.round(preexisting || 0), 100);
    const appProgressWidth = Math.min(Math.round(appProgress || 0), 100 - preexistingWidth);

    return (
      <div className={`relative h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
        {preexistingWidth > 0 && (
          <div 
            className="absolute left-0 h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${preexistingWidth}%` }}
          />
        )}
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
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading your career steps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Career Steps</h1>
          <p className="text-muted-foreground mt-2">Track your progress and complete career milestones</p>
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

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Loading your career steps...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Progress Overview */}
          <Card className="bg-gradient-to-br from-background to-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Progress Overview
              </CardTitle>
              <CardDescription>Your journey to becoming a {userData?.dreamJob || 'professional'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
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

                <div className="space-y-4">
                  <DualProgressBar 
                    preexisting={Number(careerAnalysis?.progressBreakdown?.preexistingExperience) || 0}
                    appProgress={Number(careerAnalysis?.progressBreakdown?.appProgress) || 0}
                    className="h-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Steps</h2>
              <Select 
                value={filter} 
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Steps</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {careerAnalysis?.steps?.map((step, index) => (
                <Link href={`/steps/${step.id}`} key={step.title}>
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {(step.progress?.status || step.status) === 'COMPLETED' && (
                            <div className="p-2 rounded-full bg-green-500/20">
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                          )}
                          {(step.progress?.status || step.status) === 'IN_PROGRESS' && (
                            <div className="p-2 rounded-full bg-blue-500/20">
                              <Clock className="h-6 w-6 text-blue-500" />
                            </div>
                          )}
                          {(step.progress?.status || step.status) === 'NOT_STARTED' && (
                            <div className="p-2 rounded-full bg-muted">
                              <Circle className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{step.title}</h3>
                              <p className="text-muted-foreground mt-1 line-clamp-2">
                                {step.description}
                              </p>
                            </div>
                            <Badge className={getPriorityColor(step.priority)}>
                              {step.priority.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {step.timeframe}
                            </div>
                            {(step.progress?.startedAt || step.startedAt) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Started {formatDistanceToNow(new Date(step.progress?.startedAt || step.startedAt || new Date()), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
