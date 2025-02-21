'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { auth } from "@/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  ListChecks, ChevronRight, 
  CheckCircle, Clock, Circle, Trophy, Target, Sparkles,
  GraduationCap, BookOpen, Rocket, Users,Code,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";

interface Task {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface Step {
  id: number;
  title: string;
  description: string;
  status: string;
  skillType: 'technical' | 'domain' | 'soft' | 'future';
  progress: {
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  };
}

interface UserData {
  name: string;
  dreamJob: string;
  overallProgress: number;
  upcomingTasks: Task[];
}

interface ProgressPercentage {
  "technical-proficiency": number;
  "domain-adaptation": number;
  "future-readiness": number;
  "network-strength": number;
}

interface TrendAnalysis {
  emergingTechnologies: string[];
  industryOpportunities: string[];
  riskAreas: string[];
  atRiskSkills: string[];
  crossTraining: string[];
}

interface CareerAnalysis {
  progressPercentage: ProgressPercentage;
  totalProgress: number;
  aiRoadmap: Array<{
    category: string;
    tasks: Array<{
      id: number;
      title: string;
      description: string;
      urgency: string;
      priority: string;
      skillType: string;
      resources: Array<{
        name: string;
        url?: string;
        type: string;
        provider: string;
        level: string;
        aiRelevance: string;
        timeCommitment: string;
      }>;
      successMetrics: string[];
    }>;
  }>;
  trendAnalysis: TrendAnalysis;
  certificationPath: Array<{
    name: string;
    provider: string;
    level: string;
    timeframe: string;
    purpose: string;
    timeline: string;
    prerequisites: string[];
  }>;
  projectRecommendations: Array<{
    name: string;
    description: string;
    skills: string[];
    difficulty: string;
    type: string;
    domain: string;
    businessImpact: string;
  }>;
  communityStrategy: {
    networkingTargets: string[];
    contributionOpportunities: string[];
    mentorshipRecommendations: string[];
    platforms: string[];
    focusAreas: string[];
    engagementTips: string[];
  };
  riskAssessment: {
    level: string;
    factors: string[];
    mitigationSteps: string[];
    automationThreat: string;
    skillDecay: string;
    marketCompetition: string;
  };
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

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    default:
      return 'bg-green-500/10 text-green-500 border-green-500/20';
  }
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [careerAnalysis, setCareerAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Array<Step>>([]);
  const [expandedSections, setExpandedSections] = useState({
    detailedProgress: false,
    careerInsights: false,
    riskAssessment: false,
    certifications: false,
    projects: false,
    community: false,
    skills: false
  });
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
          } catch (stepsError: unknown) {
            console.error('Error fetching steps:', stepsError instanceof Error ? stepsError.message : 'Unknown error');
            // Don't fail the whole dashboard if steps fail to load
            setSteps([]);
          }

        } catch (err: unknown) {
          console.error('Error in data fetching:', err instanceof Error ? err.message : 'Unknown error');
          const races = ['white', 'black', 'asian', 'hispanic', 'indian', 'middle eastern', 'native american', 'pacific islander'];
          const sortedRaces = races.sort();
          // Set default values for failed requests
          setCareerAnalysis({
            progressPercentage: {
              "technical-proficiency": 0,
              "domain-adaptation": 0,
              "future-readiness": 0,
              "network-strength": 0
            },
            totalProgress: 0,
            aiRoadmap: [],
            trendAnalysis: {
              emergingTechnologies: [],
              industryOpportunities: [],
              riskAreas: [],
              atRiskSkills: [],
              crossTraining: []
            } as TrendAnalysis,
            certificationPath: [],
            projectRecommendations: [],
            communityStrategy: {
              networkingTargets: [],
              contributionOpportunities: [],
              mentorshipRecommendations: [],
              platforms: [],
              focusAreas: [],
              engagementTips: []
            },
            riskAssessment: {
              level: "low",
              factors: [],
              mitigationSteps: [],
              automationThreat: "low",
              skillDecay: "No risk factors identified",
              marketCompetition: "Market competition data not available"
            }
          });
          setSteps([]);
          // Only show error if it's not a 404
          if (err instanceof Error && err.message !== '404') {
            throw err;
          }
        }
      } catch (err: unknown) {
        console.error('Error fetching data:', err instanceof Error ? err.message : 'Unknown error');
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted, router]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Overview Card */}
            <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  Career Progress
                </CardTitle>
                <CardDescription className="text-base">
                  Your journey at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Progress */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        Overall Progress
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('detailedProgress')}
                        className="text-primary"
                      >
                        {expandedSections.detailedProgress ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <DualProgressBar 
                        preexisting={Math.min(Math.round((careerAnalysis?.progressPercentage?.["technical-proficiency"] || 0) + 
                        (careerAnalysis?.progressPercentage?.["domain-adaptation"] || 0)) / 2, 40)}
                        appProgress={Math.round((steps.filter(step => step.progress.status === 'COMPLETED').length / Math.max(steps.length, 1)) * 60)}
                        className="h-4"
                      />
                      
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>Preexisting Experience</span>
                        </div>
                        <span className="font-medium">
                          {Math.min(Math.round((careerAnalysis?.progressPercentage?.["technical-proficiency"] || 0) + 
                          (careerAnalysis?.progressPercentage?.["domain-adaptation"] || 0)) / 2, 40)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Progress with Our App</span>
                        </div>
                        <span className="font-medium">
                          {Math.round((steps.filter(step => step.progress.status === 'COMPLETED').length / Math.max(steps.length, 1)) * 60)}%
                        </span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedSections.detailedProgress && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-6 space-y-4 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-blue-500" />
                                <span className="font-medium text-blue-500">Technical</span>
                              </div>
                              <div className="mt-2 text-2xl font-bold">
                                {Math.round(careerAnalysis?.progressPercentage?.["technical-proficiency"] || 0)}%
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-purple-500" />
                                <span className="font-medium text-purple-500">Domain</span>
                              </div>
                              <div className="mt-2 text-2xl font-bold">
                                {Math.round(careerAnalysis?.progressPercentage?.["domain-adaptation"] || 0)}%
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                              <div className="flex items-center gap-2">
                                <Rocket className="h-5 w-5 text-orange-500" />
                                <span className="font-medium text-orange-500">Future</span>
                              </div>
                              <div className="mt-2 text-2xl font-bold">
                                {Math.round(careerAnalysis?.progressPercentage?.["future-readiness"] || 0)}%
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                              <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-green-500" />
                                <span className="font-medium text-green-500">Network</span>
                              </div>
                              <div className="mt-2 text-2xl font-bold">
                                {Math.round(careerAnalysis?.progressPercentage?.["network-strength"] || 0)}%
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Career Insights */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Career Insights
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('careerInsights')}
                        className="text-primary"
                      >
                        {expandedSections.careerInsights ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-primary">Key Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                          {careerAnalysis?.trendAnalysis?.emergingTechnologies?.slice(0, 3).map((tech, index) => (
                            <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-primary">Growth Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {careerAnalysis?.trendAnalysis?.industryOpportunities?.slice(0, 3).map((opp, index) => (
                            <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              {opp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedSections.careerInsights && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4 overflow-hidden"
                        >
                          {/* Risk Assessment */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={cn(
                              "p-4 rounded-lg border transition-all duration-300",
                              careerAnalysis?.riskAssessment?.automationThreat === 'high' 
                                ? 'bg-red-500/10 border-red-500/20' 
                                : careerAnalysis?.riskAssessment?.automationThreat === 'medium'
                                ? 'bg-yellow-500/10 border-yellow-500/20'
                                : 'bg-green-500/10 border-green-500/20'
                            )}>
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">Automation Risk</h3>
                                <Badge variant={
                                  careerAnalysis?.riskAssessment?.automationThreat === 'high' ? 'destructive' :
                                  careerAnalysis?.riskAssessment?.automationThreat === 'medium' ? 'secondary' :
                                  'default'
                                }>
                                  {careerAnalysis?.riskAssessment?.automationThreat || 'Unknown'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                {careerAnalysis?.riskAssessment?.skillDecay || 'No risk factors identified'}
                              </p>
                            </div>

                            <div className="p-4 rounded-lg border bg-accent/30">
                              <h3 className="font-medium mb-2">Skills at Risk</h3>
                              <div className="flex flex-wrap gap-2">
                                {careerAnalysis?.trendAnalysis?.atRiskSkills?.map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="p-4 rounded-lg border bg-accent/30">
                              <h3 className="font-medium mb-2">Market Competition</h3>
                              <p className="text-sm text-muted-foreground">
                                {careerAnalysis?.riskAssessment?.marketCompetition || 'Market competition data not available'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps Card */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ListChecks className="h-6 w-6 text-primary" />
                  </div>
                  Next Steps
                </CardTitle>
                <CardDescription>Your next career milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.slice(0, 3).map((step) => (
                    <Link href={`/steps/${step.id}`} key={step.id}>
                      <div className="group relative p-4 rounded-lg bg-accent/50 hover:bg-accent/70 transition-all duration-200 cursor-pointer">
                        <div className="relative flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="p-1 rounded-full bg-muted">
                              {step.progress.status === 'COMPLETED' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : step.progress.status === 'IN_PROGRESS' ? (
                                <Clock className="h-5 w-5 text-blue-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-medium text-base group-hover:text-primary transition-colors">
                                  {step.title}
                                </h3>
                                <p className="text-muted-foreground mt-1 line-clamp-2">
                                  {step.description}
                                </p>
                              </div>
                              <Badge className={cn(
                                step.progress.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                step.progress.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                              )}>
                                {step.progress.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}

                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full mt-4 bg-accent/50 hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                  >
                    <Link href="/steps" className="flex items-center justify-center gap-2">
                      <span>View All Steps</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Career Resources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Skills Progress */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Code className="h-6 w-6 text-primary" />
                    </div>
                    Skills Progress
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('skills')}
                    className="text-primary"
                  >
                    {expandedSections.skills ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {expandedSections.skills ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Technical Skills */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-primary">Technical Skills</h3>
                        <div className="space-y-2">
                          {steps
                            .filter(step => step.skillType === 'technical')
                            .map((step, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {step.status === 'COMPLETED' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={cn(
                                  "text-sm",
                                  step.status === 'COMPLETED' ? "text-green-500" : "text-muted-foreground"
                                )}>
                                  {step.title}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Domain Skills */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-primary">Domain Knowledge</h3>
                        <div className="space-y-2">
                          {steps
                            .filter(step => step.skillType === 'domain')
                            .map((step, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {step.status === 'COMPLETED' ? (
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={cn(
                                  "text-sm",
                                  step.status === 'COMPLETED' ? "text-purple-500" : "text-muted-foreground"
                                )}>
                                  {step.title}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Soft Skills */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-primary">Soft Skills</h3>
                        <div className="space-y-2">
                          {steps
                            .filter(step => step.skillType === 'soft')
                            .map((step, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {step.status === 'COMPLETED' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={cn(
                                  "text-sm",
                                  step.status === 'COMPLETED' ? "text-green-500" : "text-muted-foreground"
                                )}>
                                  {step.title}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Future Skills */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-primary">Future-Ready Skills</h3>
                        <div className="space-y-2">
                          {steps
                            .filter(step => step.skillType === 'future')
                            .map((step, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {step.status === 'COMPLETED' ? (
                                  <CheckCircle className="h-4 w-4 text-orange-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={cn(
                                  "text-sm",
                                  step.status === 'COMPLETED' ? "text-orange-500" : "text-muted-foreground"
                                )}>
                                  {step.title}
                                </span>
                                {step.status === 'IN_PROGRESS' && (
                                  <Badge variant="secondary" className="text-xs ml-2">In Progress</Badge>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      Click to view your acquired skills
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Certification Path */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    Certifications
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('certifications')}
                    className="text-primary"
                  >
                    {expandedSections.certifications ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {expandedSections.certifications ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {careerAnalysis?.certificationPath?.map((cert, index) => (
                        <div key={index} className="p-4 rounded-lg bg-accent/50 space-y-2">
                          <h3 className="font-medium text-primary">{cert.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            {cert.purpose}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            {cert.timeline}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      Click to view recommended certifications
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Project Recommendations */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Code className="h-6 w-6 text-primary" />
                    </div>
                    Projects
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('projects')}
                    className="text-primary"
                  >
                    {expandedSections.projects ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {expandedSections.projects ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {careerAnalysis?.projectRecommendations?.map((project, index) => (
                        <div key={index} className="p-4 rounded-lg bg-accent/50 space-y-2">
                          <h3 className="font-medium text-primary">{project.type}</h3>
                          <p className="text-sm text-muted-foreground">{project.domain}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">{project.difficulty}</Badge>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      Click to view recommended projects
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Community Strategy */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    Community
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('community')}
                    className="text-primary"
                  >
                    {expandedSections.community ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {expandedSections.community ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h3 className="font-medium text-primary">Key Platforms</h3>
                        <div className="flex flex-wrap gap-2">
                          {careerAnalysis?.communityStrategy?.networkingTargets?.map((platform, index) => (
                            <Badge key={index} variant="secondary">{platform}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium text-primary">Contribution Opportunities</h3>
                        <div className="flex flex-wrap gap-2">
                          {careerAnalysis?.communityStrategy?.contributionOpportunities?.map((opp, index) => (
                            <Badge key={index} variant="outline">{opp}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium text-primary">Mentorship</h3>
                        <div className="space-y-2">
                          {careerAnalysis?.communityStrategy?.mentorshipRecommendations?.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      Click to view community engagement opportunities
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}