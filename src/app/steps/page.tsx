'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { 
  CheckCircle, 
  Circle, 
  ArrowLeft, 
  Clock, 
  ChevronRight,
  Target,
  Rocket,
  Calendar,
} from 'lucide-react'
import { auth } from "@/firebaseConfig"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'

interface ProgressPercentage {
  "technical-proficiency": number;
  "domain-adaptation": number;
  "future-readiness": number;
  "network-strength": number;
}

interface Resource {
  name: string;
  url?: string;
  type: string;
  provider: string;
  level: string;
  aiRelevance: string;
  timeCommitment: string;
  description: string;
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
  resources: Resource[];
  successMetrics: string[];
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  timelineProgress: number;
  startedAt?: string;
  completedAt?: string;
  category: string;
  timeframe: string;
}

interface CareerAnalysis {
  progressPercentage: ProgressPercentage;
  totalProgress: number;
  aiRoadmap: Array<{
    category: string;
    tasks: Step[];
  }>;
  trendAnalysis: {
    emergingTechnologies: string[];
    atRiskSkills: string[];
    crossTraining: string[];
    industryOpportunities: string[];
  };
  certificationPath: Array<{
    name: string;
    purpose: string;
    timeline: string;
    prerequisites: string[];
  }>;
  projectRecommendations: Array<{
    type: string;
    domain: string;
    complexity: string;
    businessImpact: string;
  }>;
  communityStrategy: {
    networkingTargets: string[];
    contributionOpportunities: string[];
    mentorshipRecommendations: string[];
  };
  riskAssessment: {
    automationThreat: string;
    skillDecay: string;
    marketCompetition: string;
  };
}


export default function StepsPage() {
  const [careerAnalysis, setCareerAnalysis] = useState<CareerAnalysis | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/auth');
          return;
        }

        // Fetch career analysis for progress data
        const analysisResponse = await axios.post(`/api/career-analysis`, {
          userId: user.uid
        }, {
          withCredentials: true
        });
        setCareerAnalysis(analysisResponse.data);

        // Fetch steps data
        const stepsResponse = await axios.get(`/api/steps`, {
          params: { userId: user.uid },
          withCredentials: true
        });
        setSteps(stepsResponse.data);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Filter steps based on status
  const filteredSteps = steps.filter(step => {
    switch (filter.toLowerCase()) {
      case 'not_started':
        return step.status === 'NOT_STARTED';
      case 'in_progress':
        return step.status === 'IN_PROGRESS';
      case 'completed':
        return step.status === 'COMPLETED';
      default:
        return true; // 'all' case
    }
  });

  // Group steps by category
  const groupedSteps = filteredSteps.reduce((acc, step) => {
    const category = step.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(step);
    return acc;
  }, {} as Record<string, Step[]>);

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
              <CardDescription>Your journey to becoming a {'professional'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Progress Bar */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="font-medium">Overall Progress</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>Preexisting: {Math.min(Math.round((careerAnalysis?.progressPercentage?.["technical-proficiency"] || 0) + (careerAnalysis?.progressPercentage?.["domain-adaptation"] || 0)) / 2, 40)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>App Progress: {Math.round((steps.filter(step => step.status === 'COMPLETED').length / Math.max(steps.length, 1)) * 60)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold">
                        {Math.min(
                          Math.min(Math.round((careerAnalysis?.progressPercentage?.["technical-proficiency"] || 0) + 
                          (careerAnalysis?.progressPercentage?.["domain-adaptation"] || 0)) / 2, 40) +
                          Math.round((steps.filter(step => step.status === 'COMPLETED').length / Math.max(steps.length, 1)) * 60),
                          100
                        )}%
                      </span>
                    </div>
                  </div>
                  <DualProgressBar 
                    preexisting={Math.min(Math.round((careerAnalysis?.progressPercentage?.["technical-proficiency"] || 0) + (careerAnalysis?.progressPercentage?.["domain-adaptation"] || 0)) / 2, 40)}
                    appProgress={Math.round((steps.filter(step => step.status === 'COMPLETED').length / Math.max(steps.length, 1)) * 60)}
                    className="h-4"
                  />
                </div>

                {/* Step Status Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-500">Completed</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                        {steps.filter(step => step.status === 'COMPLETED').length}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-500">In Progress</span>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
                        {steps.filter(step => step.status === 'IN_PROGRESS').length}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-yellow-500">Not Started</span>
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                        {steps.filter(step => step.status === 'NOT_STARTED').length}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Steps</h2>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing: <span className="font-medium">{filteredSteps.length}</span> of <span className="font-medium">{steps.length}</span> steps
                </p>
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
            </div>

            <div className="space-y-6">
              {Object.entries(groupedSteps).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <Rocket className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No steps found</p>
                  <p className="text-sm">Try changing the filter or check back later</p>
                </div>
              ) : (
                Object.entries(groupedSteps).map(([category, categorySteps]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-xl font-semibold">{category}</h3>
                    <div className="grid gap-4">
                      {categorySteps.map((step: Step) => (
                        <Link href={`/steps/${step.id}`} key={step.id}>
                          <Card className="hover:shadow-md transition-all duration-200">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  {step.status === 'COMPLETED' && (
                                    <div className="p-2 rounded-full bg-green-500/20">
                                      <CheckCircle className="h-6 w-6 text-green-500" />
                                    </div>
                                  )}
                                  {step.status === 'IN_PROGRESS' && (
                                    <div className="p-2 rounded-full bg-blue-500/20">
                                      <Clock className="h-6 w-6 text-blue-500" />
                                    </div>
                                  )}
                                  {step.status === 'NOT_STARTED' && (
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
                                    {step.startedAt && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        Started {formatDistanceToNow(new Date(step.startedAt), { addSuffix: true })}
                                      </div>
                                    )}
                                  </div>

                                  {step.successMetrics && step.successMetrics.length > 0 && (
                                    <div className="mt-4">
                                      <div className="flex flex-wrap gap-2">
                                        {step.successMetrics.map((metric, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            {metric}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
