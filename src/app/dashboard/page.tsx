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
  ExternalLink,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from 'lucide-react';

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
    url: string;
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
  skillsAnalysis: {
    currentSkills: Array<{
      name: string;
      category: 'technical' | 'domain' | 'soft' | 'future';
      proficiency: 'beginner' | 'intermediate' | 'advanced';
      relevance: 'high' | 'medium' | 'low';
      status: 'active' | 'growing' | 'needs-update';
    }>;
    recommendedSkills: Array<{
      name: string;
      category: 'technical' | 'domain' | 'soft' | 'future';
      priority: 'high' | 'medium' | 'low';
      timeToAcquire: string;
      relevance: 'current-market' | 'emerging-trend' | 'future-requirement';
    }>;
    skillCategories: {
      technical: string[];
      domain: string[];
      soft: string[];
      future: string[];
    };
  };
}

interface ExpandedSections {
  detailedProgress: boolean;
  careerInsights: boolean;
  riskAssessment: boolean;
  certifications: boolean;
  projects: boolean;
  community: boolean;
  skills: boolean;
}

interface TabDefinition {
  id: keyof ExpandedSections;
  icon: LucideIcon;
  label: string;
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
  const [steps, setSteps] = useState<Array<Step>>([]);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
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
          console.log('User response:', userResponse.data);
          setUserData(userResponse.data);

          // 2. Then get career analysis which includes progress
          const analysisResponse = await axios.post('/api/structure-profile', {
            userId
          }, {
            withCredentials: true,
          });
          
          // Handle the analysis response properly
          console.log('Analysis response:', analysisResponse.data);
          if (analysisResponse.data && typeof analysisResponse.data === 'object') {
            setCareerAnalysis(analysisResponse.data);
          } else {
            console.warn('Invalid analysis response:', analysisResponse.data);
            // Set default analysis data
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
              },
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
              },
              skillsAnalysis: {
                currentSkills: [],
                recommendedSkills: [],
                skillCategories: {
                  technical: [],
                  domain: [],
                  soft: [],
                  future: []
                }
              }
            });
          }

          // 3. Finally get steps
          try {
            const stepsResponse = await axios.get('/api/steps', {
              params: { userId },
              withCredentials: true,
            });
            
            console.log('Steps response:', stepsResponse.data);
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
            },
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
            },
            skillsAnalysis: {
              currentSkills: [],
              recommendedSkills: [],
              skillCategories: {
                technical: [],
                domain: [],
                soft: [],
                future: []
              }
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
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-red-500 text-lg">Error: {error}</p>
            <p className="text-muted-foreground">Your dashboard couldn't load. Let's debug this step by step.</p>
          </div>
          
          {/* Simple retry button for errors */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-background/80 via-accent/5 to-background/80 backdrop-blur-xl border border-accent/10 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Welcome back, {userData?.name || 'User'}!
                  <span className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
                    <Trophy className="h-8 w-8 text-primary" />
                </span>
              </h1>
                <p className="text-muted-foreground/80 text-lg">
                Let&apos;s continue your journey to becoming a{' '}
                <span className="text-primary font-medium">{userData?.dreamJob || 'your dream job'}</span>
              </p>
              </div>
              

            </div>
          </div>

          {/* Check if we have any data */}
          {(!userData || !careerAnalysis || steps.length === 0) && (
            <div className="text-center space-y-6 py-12">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                  <h3 className="text-xl font-semibold text-yellow-600 mb-2">No Data Found</h3>
                  <p className="text-yellow-700/80">
                    It looks like you don't have any career data yet. Let's get you started!
                  </p>
                </div>
                
                <div className="flex justify-center">
                  {/* <Button
                    variant="outline"
                    onClick={async () => {
                      const user = auth.currentUser;
                      if (user) {
                        try {
                          const response = await axios.post('/api/seed-data', {
                            userId: user.uid,
                            email: user.email,
                            name: user.displayName || 'Test User'
                          });
                          console.log('Seed data response:', response.data);
                          alert('Data seeded! Refresh the page.');
                          window.location.reload();
                        } catch (error) {
                          console.error('Error seeding data:', error);
                          alert('Error seeding data - check console');
                        }
                      }
                    }}
                    className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                  >
                    Create Sample Data
                  </Button> */}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Click "Create Sample Data" to populate your dashboard with example content.
                </p>
              </div>
            </div>
          )}

          {/* Main Content - Only show when we have data */}
          {userData && careerAnalysis && steps.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Overview Card */}
              <Card className="lg:col-span-2 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden border-0 bg-gradient-to-br from-background/80 via-accent/5 to-background/80 backdrop-blur-xl">
              <CardHeader className="border-b border-accent/10 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 backdrop-blur-xl py-8">
                <CardTitle className="text-3xl flex items-center gap-3 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-xl shadow-inner">
                    <Target className="h-7 w-7 text-primary animate-pulse" />
                  </div>
                  Career Progress
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground/80">
                  Your journey at a glance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                  {/* Overall Progress */}
                <div className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-background border border-accent/10 overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
                          <Trophy className="h-6 w-6 text-primary" />
                        Overall Progress
                      </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('detailedProgress')}
                        className="text-primary hover:bg-primary/10 transition-all duration-300"
                      >
                        {expandedSections.detailedProgress ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
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
                          <span className="text-muted-foreground">Preexisting Experience</span>
                        </div>
                        <span className="font-medium text-blue-500">
                          {Math.min(Math.round((careerAnalysis?.progressPercentage?.["technical-proficiency"] || 0) + 
                          (careerAnalysis?.progressPercentage?.["domain-adaptation"] || 0)) / 2, 40)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-muted-foreground">Progress with Our App</span>
                        </div>
                        <span className="font-medium text-green-500">
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
                          transition={{ duration: 0.3 }}
                          className="space-y-4 overflow-hidden pt-4"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              {
                                title: "Technical",
                                icon: GraduationCap,
                                color: "blue",
                                value: careerAnalysis?.progressPercentage?.["technical-proficiency"]
                              },
                              {
                                title: "Domain",
                                icon: BookOpen,
                                color: "purple",
                                value: careerAnalysis?.progressPercentage?.["domain-adaptation"]
                              },
                              {
                                title: "Future",
                                icon: Rocket,
                                color: "orange",
                                value: careerAnalysis?.progressPercentage?.["future-readiness"]
                              },
                              {
                                title: "Network",
                                icon: Users,
                                color: "green",
                                value: careerAnalysis?.progressPercentage?.["network-strength"]
                              }
                            ].map((stat, index) => (
                              <motion.div
                                key={stat.title}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                  "group relative p-4 rounded-2xl border backdrop-blur-xl",
                                  `border-${stat.color}-500/20 bg-gradient-to-br from-${stat.color}-500/10 via-background to-${stat.color}-500/5`
                                )}
                              >
                                <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                                <div className="relative space-y-2">
                              <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "p-2 rounded-xl transition-colors duration-300",
                                      `bg-${stat.color}-500/10 group-hover:bg-${stat.color}-500/20`
                                    )}>
                                      <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                              </div>
                                    <span className={`font-medium text-${stat.color}-500`}>{stat.title}</span>
                              </div>
                                  <div className="text-2xl font-bold">
                                    {Math.round(stat.value || 0)}%
                            </div>
                              </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  </div>

                  {/* Career Insights */}
                <div className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-background border border-accent/10 overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
                          <Sparkles className="h-6 w-6 text-primary" />
                        Career Insights
                      </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('careerInsights')}
                        className="text-primary hover:bg-primary/10 transition-all duration-300"
                      >
                        {expandedSections.careerInsights ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Trophy className="h-4 w-4 text-primary" />
                          </div>
                          Key Strengths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {careerAnalysis?.trendAnalysis?.emergingTechnologies && Array.isArray(careerAnalysis.trendAnalysis.emergingTechnologies) && careerAnalysis.trendAnalysis.emergingTechnologies.length > 0 ? (
                            careerAnalysis.trendAnalysis.emergingTechnologies.slice(0, 3).map((tech, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-all duration-300"
                              >
                                {tech}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              AI/ML
                            </Badge>
                          )}
                        </div>
                  </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-primary flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Target className="h-4 w-4 text-primary" />
                          </div>
                          Growth Areas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {careerAnalysis?.trendAnalysis?.industryOpportunities && Array.isArray(careerAnalysis.trendAnalysis.industryOpportunities) && careerAnalysis.trendAnalysis.industryOpportunities.length > 0 ? (
                            careerAnalysis.trendAnalysis.industryOpportunities.slice(0, 3).map((opp, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-all duration-300"
                              >
                                {opp}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              Remote Work
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedSections.careerInsights && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6 overflow-hidden pt-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              {
                                title: "Automation Risk",
                                icon: Sparkles,
                                level: careerAnalysis?.riskAssessment?.automationThreat,
                                description: careerAnalysis?.riskAssessment?.skillDecay
                              },
                              {
                                title: "Skills at Risk",
                                icon: Target,
                                items: careerAnalysis?.trendAnalysis?.atRiskSkills && Array.isArray(careerAnalysis.trendAnalysis.atRiskSkills) ? careerAnalysis.trendAnalysis.atRiskSkills : []
                              },
                              {
                                title: "Market Competition",
                                icon: Users,
                                description: careerAnalysis?.riskAssessment?.marketCompetition
                              }
                            ].map((section, index) => (
                              <motion.div
                                key={section.title}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                  "group relative p-4 rounded-2xl border border-accent/10 backdrop-blur-xl",
                                  "bg-gradient-to-br from-accent/10 via-background to-accent/5"
                                )}
                              >
                                <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                                <div className="relative space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                                      <section.icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <h3 className="font-medium">{section.title}</h3>
                                    {section.level && (
                                <Badge variant={
                                        section.level === 'high' ? 'destructive' :
                                        section.level === 'medium' ? 'secondary' :
                                  'default'
                                }>
                                        {section.level}
                                </Badge>
                                    )}
                              </div>
                                  {section.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {section.description}
                                    </p>
                                  )}
                                  {section.items && Array.isArray(section.items) && section.items.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {section.items.map((item, i) => (
                                        <Badge
                                          key={i}
                                          variant="outline"
                                          className="bg-accent/10 hover:bg-accent/20 transition-colors duration-300 text-xs"
                                        >
                                          {item}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      No items available
                                    </div>
                                  )}
                            </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps Card */}
            <Card className="shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden border-0 bg-gradient-to-br from-background/80 via-accent/5 to-background/80 backdrop-blur-xl">
              <CardHeader className="border-b border-accent/10 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 backdrop-blur-xl py-8">
                <CardTitle className="text-3xl flex items-center gap-3 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-xl shadow-inner">
                    <ListChecks className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  Next Steps
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground/80">
                  Your next career milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {steps.slice(0, 3).map((step, index) => (
                    <Link href={`/steps/${step.id}`} key={step.id}>
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative p-4 rounded-xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl hover:bg-accent/10 transition-all duration-300 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                        <div className="relative flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className={cn(
                              "p-2 rounded-xl transition-colors duration-300",
                              step.progress.status === 'COMPLETED'
                                ? "bg-green-500/10 group-hover:bg-green-500/20"
                                : step.progress.status === 'IN_PROGRESS'
                                ? "bg-blue-500/10 group-hover:bg-blue-500/20"
                                : "bg-yellow-500/10 group-hover:bg-yellow-500/20"
                            )}>
                              {step.progress.status === 'COMPLETED' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : step.progress.status === 'IN_PROGRESS' ? (
                                <Clock className="h-5 w-5 text-blue-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className="font-medium text-base group-hover:text-primary transition-colors">
                                  {step.title}
                                </h3>
                                <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 line-clamp-2">
                                  {step.description}
                                </p>
                              </div>
                              <Badge className={cn(
                                "transition-colors duration-300",
                                step.progress.status === 'COMPLETED'
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : step.progress.status === 'IN_PROGRESS'
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              )}>
                                {step.progress.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.div>
                    </Link>
                  ))}

                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full mt-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 hover:bg-accent/20 transition-all duration-300 border-accent/20"
                  >
                    <Link href="/steps" className="flex items-center justify-center gap-2">
                      <span>View All Steps</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>)}

          {/* Additional Career Resources */}
          <div className="mt-6">
            <Card className="shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden border-0 bg-gradient-to-br from-background/80 via-accent/5 to-background/80 backdrop-blur-xl">
              <CardHeader className="border-b border-accent/10 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 backdrop-blur-xl py-8">
                <CardTitle className="text-3xl flex items-center gap-3 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-xl shadow-inner">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                  Career Resources
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground/80">
                  Your personalized pathway to professional excellence
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* Tab Buttons */}
                  <div className="flex flex-col sm:flex-row border-b border-accent/10 bg-gradient-to-r from-accent/5 via-background to-accent/5">
                    <div className="flex items-center justify-between px-6 py-3 sm:py-0">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {([
                          { 
                            id: 'skills' as const, 
                            icon: Code, 
                            label: 'Skills Progress',
                            color: 'from-blue-500/20 to-primary/20'
                          },
                          { 
                            id: 'certifications' as const, 
                            icon: GraduationCap, 
                            label: 'Certifications',
                            color: 'from-purple-500/20 to-blue-500/20'
                          },
                          { 
                            id: 'projects' as const, 
                            icon: Code, 
                            label: 'Project Recommendations',
                            color: 'from-orange-500/20 to-purple-500/20'
                          },
                          { 
                            id: 'community' as const, 
                            icon: Users, 
                            label: 'Community',
                            color: 'from-green-500/20 to-orange-500/20'
                          }
                        ] as const).map((tab: TabDefinition & { color: string }) => (
                  <Button
                            key={tab.id}
                    variant="ghost"
                            className={cn(
                              "relative min-w-[140px] h-14 px-4 rounded-none border-0",
                              "transition-all duration-300 ease-in-out",
                              expandedSections[tab.id] 
                                ? "text-primary font-medium bg-gradient-to-b from-transparent via-transparent to-primary/5" 
                                : "text-muted-foreground hover:text-primary hover:bg-accent/5",
                              "group overflow-hidden"
                            )}
                            onClick={() => {
                              const newState: ExpandedSections = {
                                ...expandedSections,
                                detailedProgress: false,
                                careerInsights: false,
                                riskAssessment: false,
                                skills: false,
                                certifications: false,
                                projects: false,
                                community: false,
                                [tab.id]: true
                              };
                              setExpandedSections(newState);
                            }}
                          >
                            {/* Background Effects */}
                            {expandedSections[tab.id] && (
                              <motion.div
                                layoutId="tabBackground"
                                className={cn(
                                  "absolute inset-0 bg-gradient-to-r opacity-20",
                                  tab.color
                                )}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.2 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                            
                            <div className="relative flex flex-col items-center gap-1">
                              <div className={cn(
                                "p-1.5 rounded-lg transition-all duration-300 transform",
                                expandedSections[tab.id]
                                  ? "scale-110 bg-primary/10"
                                  : "bg-transparent group-hover:scale-110 group-hover:bg-primary/5"
                              )}>
                                <tab.icon className={cn(
                                  "h-4 w-4 transition-colors duration-300",
                                  expandedSections[tab.id]
                                    ? "text-primary"
                                    : "text-muted-foreground group-hover:text-primary"
                                )} />
                              </div>
                              
                                <span className={cn(
                                "text-sm transition-colors duration-300",
                                expandedSections[tab.id]
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-primary"
                              )}>
                                {tab.label}
                                </span>

                              {/* Active Indicator */}
                              {expandedSections[tab.id] && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="absolute -bottom-[1.5px] left-0 right-0 h-0.5 bg-primary"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                />
                              )}
                              </div>
                          </Button>
                            ))}
                      </div>
                        </div>
                      </div>

                  {/* Tab Content */}
                  <div className="min-h-[500px] p-8 bg-gradient-to-br from-transparent via-accent/5 to-transparent">
                    <AnimatePresence mode="wait">
                      {/* Skills Progress Content */}
                      {expandedSections.skills && (
                        <motion.div
                          key="skills"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-8"
                        >
                          {/* Skills Overview */}
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-background border border-accent/10 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                            <div className="relative flex items-center justify-between">
                              <div className="space-y-1">
                                <h3 className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                                  Skills Mastery Path
                                </h3>
                                <p className="text-muted-foreground">Track your skill development journey</p>
                              </div>
                              <div className="flex gap-3">
                                <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                                  <Code className="h-6 w-6 text-primary" />
                                </div>
                                <div className="p-3 rounded-2xl bg-purple-500/10 backdrop-blur-sm">
                                  <BookOpen className="h-6 w-6 text-purple-500" />
                                </div>
                                <div className="p-3 rounded-2xl bg-orange-500/10 backdrop-blur-sm">
                                  <Rocket className="h-6 w-6 text-orange-500" />
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Current Skills */}
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative p-6 rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl"
                          >
                            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                            <div className="relative space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="text-lg font-medium">Current Skills</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                                {careerAnalysis?.skillsAnalysis?.currentSkills && Array.isArray(careerAnalysis.skillsAnalysis.currentSkills) ? (
                                  careerAnalysis.skillsAnalysis.currentSkills.map((skill, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ delay: index * 0.1 }}
                                      className="relative flex items-start gap-3 p-4 rounded-xl bg-accent/10 hover:bg-accent/20 transition-all duration-300 group"
                                    >
                                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
                                      <div className="space-y-2 flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{skill.name || 'Unnamed Skill'}</span>
                                          <Badge variant="outline" className={cn(
                                            "transition-colors duration-300",
                                            skill.proficiency === 'advanced' ? 'border-green-500/20 text-green-500' :
                                            skill.proficiency === 'intermediate' ? 'border-blue-500/20 text-blue-500' :
                                            'border-orange-500/20 text-orange-500'
                                          )}>
                                            {skill.proficiency || 'beginner'}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                                            {skill.category || 'technical'}
                                          </Badge>
                                          <Badge variant="secondary" className={cn(
                                            "text-xs",
                                            skill.relevance === 'high' ? 'bg-green-500/10 text-green-500' :
                                            skill.relevance === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-orange-500/10 text-orange-500'
                                          )}>
                                            {skill.relevance || 'medium'} relevance
                                          </Badge>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="col-span-2 text-center text-muted-foreground py-8">
                                    <div className="p-4 rounded-xl bg-accent/10">
                                      <p>No current skills data available</p>
                                      <p className="text-sm">Complete your profile to see your skills analysis</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>

                          {/* Recommended Skills */}
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative p-6 rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl"
                          >
                            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                            <div className="relative space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                  <Target className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="text-lg font-medium">Recommended Skills</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                                {careerAnalysis?.skillsAnalysis?.recommendedSkills && Array.isArray(careerAnalysis.skillsAnalysis.recommendedSkills) ? (
                                  careerAnalysis.skillsAnalysis.recommendedSkills.map((skill, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ delay: index * 0.1 }}
                                      className="relative flex items-start gap-3 p-4 rounded-xl bg-accent/10 hover:bg-accent/20 transition-all duration-300 group"
                                    >
                                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
                                      <div className="space-y-2 flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{skill.name || 'Unnamed Skill'}</span>
                                          <Badge variant="outline" className={cn(
                                            "transition-colors duration-300",
                                            skill.priority === 'high' ? 'border-red-500/20 text-red-500' :
                                            skill.priority === 'medium' ? 'border-yellow-500/20 text-yellow-500' :
                                            'border-blue-500/20 text-blue-500'
                                          )}>
                                            {skill.priority || 'medium'} priority
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                                            {skill.category || 'technical'}
                                          </Badge>
                                          <Badge variant="secondary" className="bg-accent/10 text-xs">
                                            {skill.timeToAcquire || '3-6 months'}
                                          </Badge>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                          "text-xs",
                                          skill.relevance === 'current-market' ? 'border-green-500/20 text-green-500' :
                                          skill.relevance === 'emerging-trend' ? 'border-blue-500/20 text-blue-500' :
                                          'border-purple-500/20 text-purple-500'
                                        )}>
                                          {skill.relevance ? skill.relevance.replace('-', ' ') : 'current market'}
                                        </Badge>
                                      </div>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="col-span-2 text-center text-muted-foreground py-8">
                                    <div className="p-4 rounded-xl bg-accent/10">
                                      <p>No recommended skills data available</p>
                                      <p className="text-sm">Complete your profile to get personalized skill recommendations</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>

                          {/* Skills by Category */}
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                          >
                            {careerAnalysis?.skillsAnalysis?.skillCategories && Object.keys(careerAnalysis.skillsAnalysis.skillCategories).length > 0 ? (
                              Object.entries(careerAnalysis.skillsAnalysis.skillCategories).map(([category, skills], idx) => (
                                <motion.div
                                  key={category}
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="relative p-6 rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl"
                                >
                                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                                  <div className="relative space-y-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-xl bg-primary/10">
                                        {category === 'technical' ? <Code className="h-5 w-5 text-primary" /> :
                                         category === 'domain' ? <BookOpen className="h-5 w-5 text-primary" /> :
                                         category === 'soft' ? <Users className="h-5 w-5 text-primary" /> :
                                         <Rocket className="h-5 w-5 text-primary" />}
                                      </div>
                                      <h4 className="text-lg font-medium capitalize">{category} Skills</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pl-8">
                                      {Array.isArray(skills) ? skills.map((skill, index) => (
                                        <Badge
                                          key={index}
                                          variant="secondary"
                                          className="bg-primary/10 hover:bg-primary/20 text-primary text-xs transition-colors duration-300"
                                        >
                                          {skill}
                                        </Badge>
                                      )) : (
                                        <Badge variant="secondary" className="text-xs">
                                          No skills listed
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="col-span-2 text-center text-muted-foreground py-8">
                                <div className="p-4 rounded-xl bg-accent/10">
                                  <p>No skill categories available</p>
                                  <p className="text-sm">Complete your profile to see categorized skills</p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Certifications Content */}
                      {expandedSections.certifications && (
                        <motion.div
                          key="certifications"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-8"
                        >
                          {/* Certifications Overview */}
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-background border border-accent/10 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                            <div className="relative flex items-center justify-between">
                              <div className="space-y-1">
                                <h3 className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                                  Professional Certifications
                                </h3>
                                <p className="text-muted-foreground">Validate your expertise with industry-recognized credentials</p>
                              </div>
                              <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                          </motion.div>

                          {/* Certification Grid */}
                          <div className="grid gap-6 md:grid-cols-2">
                            {careerAnalysis?.certificationPath && Array.isArray(careerAnalysis.certificationPath) && careerAnalysis.certificationPath.length > 0 ? (
                              careerAnalysis.certificationPath.map((cert, index) => (
                                <motion.div
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  key={index}
                                  className="group relative p-6 rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl"
                                >
                                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                                  <div className="relative space-y-4">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <h4 className="text-lg font-medium group-hover:text-primary transition-colors duration-300">
                                          {cert.name || 'Unnamed Certification'}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          {cert.provider || 'Provider not specified'}
                                        </p>
                                      </div>
                                      <Badge variant="outline" className={cn(
                                        "transition-colors duration-300",
                                        cert.level === 'beginner' ? 'border-green-500/20 text-green-500' :
                                        cert.level === 'intermediate' ? 'border-blue-500/20 text-blue-500' :
                                        'border-purple-500/20 text-purple-500'
                                      )}>
                                        {cert.level || 'Not specified'}
                                      </Badge>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="p-1.5 rounded-lg bg-primary/10">
                                          <Clock className="h-4 w-4 text-primary" />
                                        </div>
                                        {cert.timeline || 'Timeline not specified'}
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-primary/10">
                                            <Target className="h-4 w-4 text-primary" />
                                          </div>
                                          <span className="text-sm font-medium">Purpose</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground pl-8">
                                          {cert.purpose || 'Purpose not specified'}
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-primary/10">
                                            <ListChecks className="h-4 w-4 text-primary" />
                                          </div>
                                          <span className="text-sm font-medium">Prerequisites</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-8">
                                          {Array.isArray(cert.prerequisites) && cert.prerequisites.length > 0 ? (
                                            cert.prerequisites.map((prereq, i) => (
                                              <Badge
                                                key={i}
                                                variant="outline"
                                                className="bg-accent/10 hover:bg-accent/20 transition-colors duration-300 text-xs"
                                              >
                                                {prereq}
                                              </Badge>
                                            ))
                                          ) : (
                                            <Badge variant="outline" className="text-xs">
                                              No prerequisites
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {cert.url && (
                                      <Link 
                                        href={cert.url}
                                        target="_blank"
                                        className={cn(
                                          "mt-4 inline-flex items-center gap-2 text-sm",
                                          "text-primary hover:text-primary/80",
                                          "group-hover:translate-x-1 transition-all duration-300"
                                        )}
                                      >
                                        <span>View Certification Details</span>
                                        <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    )}
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="col-span-2 text-center text-muted-foreground py-8">
                                <div className="p-4 rounded-xl bg-accent/10">
                                  <p>No certifications available</p>
                                  <p className="text-sm">Complete your profile to get certification recommendations</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Project Recommendations Content */}
                      {expandedSections.projects && (
                        <motion.div
                          key="projects"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-8"
                        >
                          {/* Projects Overview */}
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-background border border-accent/10 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                            <div className="relative flex items-center justify-between">
                              <div className="space-y-1">
                                <h3 className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                                  Recommended Projects
                                </h3>
                                <p className="text-muted-foreground">Curated projects to showcase your skills</p>
                              </div>
                              <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                      <Code className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                          </motion.div>

                          {/* Project Grid */}
                          <div className="grid gap-6 md:grid-cols-2">
                            {careerAnalysis?.projectRecommendations && Array.isArray(careerAnalysis.projectRecommendations) && careerAnalysis.projectRecommendations.length > 0 ? (
                              careerAnalysis.projectRecommendations.map((project, index) => (
                                <motion.div
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  key={index}
                                  className="group relative p-6 rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl"
                                >
                                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                                  <div className="relative space-y-4">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <h4 className="text-lg font-medium group-hover:text-primary transition-colors duration-300">
                                          {project.name || 'Unnamed Project'}
                                        </h4>
                                        <div className="flex gap-2">
                                          <Badge variant="outline" className="bg-accent/10 text-xs">
                                            {project.type || 'Not specified'}
                                          </Badge>
                                          <Badge variant="outline" className="bg-accent/10 text-xs">
                                            {project.domain || 'Not specified'}
                                          </Badge>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className={cn(
                                        "transition-colors duration-300",
                                        project.difficulty === 'beginner' ? 'border-green-500/20 text-green-500' :
                                        project.difficulty === 'intermediate' ? 'border-blue-500/20 text-blue-500' :
                                        'border-purple-500/20 text-purple-500'
                                      )}>
                                        {project.difficulty || 'Not specified'}
                                      </Badge>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-primary/10">
                                            <Target className="h-4 w-4 text-primary" />
                                          </div>
                                          <span className="text-sm font-medium">Project Overview</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground pl-8">
                                          {project.description || 'No description available'}
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-primary/10">
                                            <Code className="h-4 w-4 text-primary" />
                                          </div>
                                          <span className="text-sm font-medium">Required Skills</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-8">
                                          {Array.isArray(project.skills) && project.skills.length > 0 ? (
                                            project.skills.map((skill, i) => (
                                              <Badge
                                                key={i}
                                                variant="secondary"
                                                className="bg-primary/10 hover:bg-primary/20 text-primary text-xs transition-colors duration-300"
                                              >
                                                {skill || 'Unnamed Skill'}
                                              </Badge>
                                            ))
                                          ) : (
                                            <Badge variant="secondary" className="text-xs">
                                              No skills specified
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-primary/10">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                          </div>
                                          <span className="text-sm font-medium">Business Impact</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground pl-8">
                                          {project.businessImpact || 'No business impact specified'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="col-span-2 text-center text-muted-foreground py-8">
                                <div className="p-4 rounded-xl bg-accent/10">
                                  <p>No project recommendations available</p>
                                  <p className="text-sm">Complete your profile to get personalized project suggestions</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Community Content */}
                      {expandedSections.community && (
                        <motion.div
                          key="community"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-8"
                        >
                          {/* Community Overview */}
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-background border border-accent/10 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                            <div className="relative flex items-center justify-between">
                              <div className="space-y-1">
                                <h3 className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                                  Community Engagement
                                </h3>
                                <p className="text-muted-foreground">Connect, contribute, and grow with the community</p>
                              </div>
                              <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                          </motion.div>

                          <div className="grid gap-6 md:grid-cols-2">
                            {/* Networking Platforms */}
                    <motion.div
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="group relative p-6 rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl"
                            >
                              <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                              <div className="relative space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                  <h4 className="text-lg font-medium">Key Platforms</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pl-12">
                                  {careerAnalysis?.communityStrategy?.networkingTargets && Array.isArray(careerAnalysis.communityStrategy.networkingTargets) && careerAnalysis.communityStrategy.networkingTargets.length > 0 ? (
                                    careerAnalysis.communityStrategy.networkingTargets.map((platform, index) => (
                                      <motion.div
                                        key={index}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors duration-300"
                                      >
                                        <div className="p-1 rounded-lg bg-primary/10">
                                          <Users className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-sm">{platform}</span>
                                      </motion.div>
                                    ))
                                  ) : (
                                    <div className="col-span-2 text-center text-muted-foreground py-4">
                                      <p className="text-xs">No networking targets available</p>
                                    </div>
                                  )}
                                </div>
                      </div>
                            </motion.div>

                            {/* Contribution Opportunities */}
                            <motion.div
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="group relative p-6 rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl"
                            >
                              <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                              <div className="relative space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                                    <Target className="h-5 w-5 text-primary" />
                                  </div>
                                  <h4 className="text-lg font-medium">Contribution Opportunities</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pl-12">
                                  {careerAnalysis?.communityStrategy?.contributionOpportunities && Array.isArray(careerAnalysis.communityStrategy.contributionOpportunities) && careerAnalysis.communityStrategy.contributionOpportunities.length > 0 ? (
                                    careerAnalysis.communityStrategy.contributionOpportunities.map((opp, index) => (
                                      <motion.div
                                        key={index}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors duration-300"
                                      >
                                        <div className="p-1 rounded-lg bg-primary/10">
                                          <Target className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-sm">{opp}</span>
                                      </motion.div>
                                    ))
                                  ) : (
                                    <div className="col-span-2 text-center text-muted-foreground py-4">
                                      <p className="text-xs">No contribution opportunities available</p>
                                    </div>
                                  )}
                                </div>
                      </div>
                            </motion.div>

                            {/* Mentorship Opportunities */}
                            <motion.div
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="md:col-span-2 group relative p-6 rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-background to-accent/5 backdrop-blur-xl"
                            >
                              <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                              <div className="relative space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                  <h4 className="text-lg font-medium">Mentorship Journey</h4>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 pl-12">
                                  {careerAnalysis?.communityStrategy?.mentorshipRecommendations && Array.isArray(careerAnalysis.communityStrategy.mentorshipRecommendations) && careerAnalysis.communityStrategy.mentorshipRecommendations.length > 0 ? (
                                    careerAnalysis.communityStrategy.mentorshipRecommendations.map((rec, index) => (
                                      <motion.div
                                        key={index}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative flex items-start gap-3 p-4 rounded-xl bg-accent/10 hover:bg-accent/20 transition-all duration-300 group/item"
                                      >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
                                        <div className="p-1.5 rounded-lg bg-green-500/10 group-hover/item:bg-green-500/20 transition-colors duration-300">
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors duration-300">
                                            {rec}
                                          </span>
                                        </div>
                                      </motion.div>
                                    ))
                                  ) : (
                                    <div className="col-span-2 text-center text-muted-foreground py-8">
                                      <div className="p-4 rounded-xl bg-accent/10">
                                        <p>No mentorship recommendations available</p>
                                        <p className="text-sm">Complete your profile to get mentorship suggestions</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                      </div>
                    </motion.div>
                    </div>
                        </motion.div>
                  )}
                </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}