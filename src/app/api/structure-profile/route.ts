import { prisma } from '../../../config/prisma';
import { openai } from '../../../config/openai';
import { NextRequest, NextResponse } from 'next/server';
import { Skill } from '@prisma/client';

interface StructuredData {
    jobDescription?: string;
    currentRole?: string;
    yearsOfExperience?: string;
    educationLevel?: string;
    industryPreferences?: string[];
    preferredWorkEnvironment?: string[];
    careerMotivations?: string[];
}

interface ProgressPercentage {
    "technical-proficiency": number;
    "domain-adaptation": number;
    "future-readiness": number;
    "network-strength": number;
}

interface Category {
    category: string;
    tasks: Task[];
}

interface Task {
    title: string;
    description: string;
    urgency: string;
    priority: string;
    skillType: string;
    resources: Resource[];
    successMetrics: string[];
}

interface Resource {
    name: string;
    description: string;
    url: string;
    type: string;
    provider: string;
    level: string;
    aiRelevance: string;
    timeCommitment: string;
    category: string;
    tags: string;
    isFree: boolean;
}

interface Certification {
    name: string;
    purpose: string;
    timeline: string;
    prerequisites: string[];
    provider: string;
    level: string;
}

interface ProjectRecommendation {
    name: string;
    description: string;
    skills: string[];
    difficulty: string;
    type: string;
    domain: string;
    businessImpact: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get user data with proper null checks
        const userData = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: {
                    include: {
                        skills: true
                    }
                },
                tasks: true,
                stepProgress: true,
                careerAnalyses: {
                    include: {
                        steps: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        console.log('Found user data:', userData ? 'yes' : 'no', userData?.id);

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check for recent analysis first
        const recentAnalysis = await prisma.careerAnalysis.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                steps: true
            }
        });

        if (recentAnalysis) {
            // Return the stored analysis with its progress data
            const storedAnalysis = JSON.parse(recentAnalysis.analysis);
            return NextResponse.json(storedAnalysis);
        }

        const bio = userData.profile?.bio || 'Not provided';
        const dreamJob = userData.profile?.dreamJob || 'Not specified';
        const skills = userData.profile?.skills?.map((s: Skill) => s.name).join(', ') || 'None listed';
        const structuredData = userData.profile?.structuredData as StructuredData || {};
        const jobDescription = structuredData.jobDescription || 'Not provided';
        const currentRole = structuredData.currentRole || 'Not specified';
        const yearsOfExperience = structuredData.yearsOfExperience || 'Not specified';
        const educationLevel = structuredData.educationLevel || 'Not specified';
        const industryPreferences = structuredData.industryPreferences?.join(', ') || 'Not specified';
        const workEnvironment = structuredData.preferredWorkEnvironment?.join(', ') || 'Not specified';
        const careerMotivations = structuredData.careerMotivations?.join(', ') || 'Not specified';

        // Create the analysis
        const prompt = `
        Analyze my career profile through the lens of AI industry trends and provide a structured development plan to future-proof my career. Consider emerging technologies, skill demand forecasts, and adjacent domain opportunities.
        
        Current Profile:
        - Current Role: ${currentRole}
        - Years of Experience: ${yearsOfExperience}
        - Education Level: ${educationLevel}
        - Current Skills: ${skills}
        - Bio/Resume: ${bio}
        
        Career Goals:
        - Dream Job: ${dreamJob}
        - Target Job Description: ${jobDescription}
        - Industry Preferences: ${industryPreferences}
        - Preferred Work Environment: ${workEnvironment}
        - Career Motivations: ${careerMotivations}
        
        Please analyze this profile and create a detailed, personalized career development plan that:
        1. Maps current skills to the target role requirements
        2. Identifies skill gaps based on the provided job description
        3. Suggests learning paths aligned with stated career motivations
        4. Considers industry preferences and work environment preferences
        5. Accounts for current experience level and education background
        
        Provide your response in this JSON format:
        {
            "progressPercentage": {
                "technical-proficiency": 0-100,
                "domain-adaptation": 0-100,
                "future-readiness": 0-100,
                "network-strength": 0-100
            },
            "aiRoadmap": [
                {
                    "category": "Core Technical Skills/Applied AI/Strategic AI/Network Building",
                    "tasks": [
                        {
                            "title": "task title aligned with AI trends",
                            "description": "actionable steps with success metrics",
                            "urgency": "immediate (0-6mo)/near-term (6-12mo)/future (12-24mo)",
                            "priority": "critical/high/medium",
                            "skillType": "hard skill/soft skill/industry knowledge",
                            "resources": [
                                {
                                    "name": "resource name",
                                    "url": "resource URL",
                                    "type": "course/certification/hackathon/open-source project",
                                    "provider": "AWS/Azure/Google Cloud/DeepLearning.AI etc.",
                                    "level": "beginner/intermediate/advanced",
                                    "aiRelevance": "foundational/specialized/emerging",
                                    "timeCommitment": "hours per week"
                                }
                            ],
                            "successMetrics": ["specific measurable outcomes"]
                        }
                    ]
                }
            ],
            "trendAnalysis": {
                "emergingTechnologies": ["list of relevant AI trends"],
                "atRiskSkills": ["skills becoming obsolete"],
                "crossTraining": ["adjacent skills to develop"],
                "industryOpportunities": ["high-growth AI application areas"]
            },
            "certificationPath": [
                {
                    "name": "certification name",
                    "purpose": "career stage alignment",
                    "timeline": "recommended completion date",
                    "prerequisites": ["required skills/knowledge"]
                }
            ],
            "projectRecommendations": [
                {
                    "type": "portfolio/showcase/research/OSS contribution",
                    "domain": "computer vision/NLP/generative AI etc.",
                    "complexity": "beginner/intermediate/expert",
                    "businessImpact": "potential use cases"
                }
            ],
            "communityStrategy": {
                "networkingTargets": ["AI influencers", "research groups", "professional associations"],
                "contributionOpportunities": ["meetups", "conferences", "writing"],
                "mentorshipRecommendations": ["potential mentors", "peer groups"]
            },
            "riskAssessment": {
                "automationThreat": "low/medium/high",
                "skillDecay": "vulnerable areas",
                "marketCompetition": "job market analysis"
            }
        }`;

        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are a career advisor specializing in artificial intelligence. 
                    Your role is to provide structured JSON responses with specific, 
                    actionable career development plans to help users adapt to the rapidly evolving AI job market. 
                    Each task should include an array of learning resources (articles, courses, videos, etc.) to help the user complete the task. 
                    Additionally, provide an analysis of current and emerging AI trends, and how the user can align their skills and career goals 
                    with these trends. Always ensure the "resources" field is an array, even if empty [].
                    provide at least 10 tasks and make sure they are aligned with the user's dream job and skills and can done in the shortest time possible`
                },
                { 
                    role: "user", 
                    content: prompt 
                }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        });

        if (!completion.choices[0].message.content) {
            return NextResponse.json({
                error: "Failed to generate analysis",
                progressPercentage: {
                    "technical-proficiency": 0,
                    "domain-adaptation": 0,
                    "future-readiness": 0,
                    "network-strength": 0
                },
                aiRoadmap: [],
                trendAnalysis: {
                    emergingTechnologies: [],
                    atRiskSkills: [],
                    crossTraining: [],
                    industryOpportunities: []
                },
                certificationPath: [],
                projectRecommendations: [],
                communityStrategy: {
                    networkingTargets: [],
                    contributionOpportunities: [],
                    mentorshipRecommendations: []
                },
                riskAssessment: {
                    automationThreat: "low",
                    skillDecay: "none",
                    marketCompetition: "unknown"
                }
            });
        }

        const response = JSON.parse(completion.choices[0].message.content);

        // Calculate the total progress from the OpenAI response
        const progressPercentage = response.progressPercentage as ProgressPercentage;
        const totalProgress = Object.values(progressPercentage).reduce((a, b) => a + b, 0) / 4;

        // Add the total progress to the response
        response.totalProgress = Math.round(totalProgress);

        // Ensure each task has a resources array
        if (response.aiRoadmap) {
            response.aiRoadmap.forEach((category: Category) => {
                category.tasks = category.tasks.map((task: Task) => ({
                    ...task,
                    resources: Array.isArray(task.resources) ? task.resources : []
                }));
            });
        }

        // Save the analysis
        await prisma.careerAnalysis.create({
            data: {
                userId,
                analysis: JSON.stringify(response),
                progressPercentage: {
                    "technical-proficiency": response.progressPercentage["technical-proficiency"],
                    "domain-adaptation": response.progressPercentage["domain-adaptation"],
                    "future-readiness": response.progressPercentage["future-readiness"],
                    "network-strength": response.progressPercentage["network-strength"]
                },
                totalProgress: response.totalProgress,
                aiRoadmap: response.aiRoadmap.map((category: Category) => ({
                    category: category.category,
                    tasks: category.tasks.map((task: Task) => ({
                        title: task.title,
                        description: task.description,
                        urgency: task.urgency,
                        priority: task.priority,
                        skillType: task.skillType,
                        resources: task.resources || [],
                        successMetrics: task.successMetrics || []
                    }))
                })),
                trendAnalysis: {
                    emergingTechnologies: response.trendAnalysis.emergingTechnologies || [],
                    atRiskSkills: response.trendAnalysis.atRiskSkills || [],
                    crossTraining: response.trendAnalysis.crossTraining || [],
                    industryOpportunities: response.trendAnalysis.industryOpportunities || []
                },
                certificationPath: response.certificationPath.map((cert: Certification) => ({
                    name: cert.name,
                    purpose: cert.purpose,
                    timeline: cert.timeline,
                    prerequisites: cert.prerequisites || [],
                    provider: cert.provider || 'General',
                    level: cert.level || 'Beginner'
                })),
                projectRecommendations: response.projectRecommendations.map((project: ProjectRecommendation) => ({
                    name: project.name || 'Unnamed Project',
                    description: project.description || '',
                    skills: project.skills || [],
                    difficulty: project.difficulty || 'beginner',
                    type: project.type || 'portfolio',
                    domain: project.domain || 'general',
                    businessImpact: project.businessImpact || ''
                })),
                communityStrategy: {
                    networkingTargets: response.communityStrategy.networkingTargets || [],
                    contributionOpportunities: response.communityStrategy.contributionOpportunities || [],
                    mentorshipRecommendations: response.communityStrategy.mentorshipRecommendations || [],
                    platforms: response.communityStrategy.platforms || [],
                    focusAreas: response.communityStrategy.focusAreas || [],
                    engagementTips: response.communityStrategy.engagementTips || []
                },
                riskAssessment: {
                    level: response.riskAssessment.automationThreat || 'low',
                    factors: response.riskAssessment.skillDecay ? [response.riskAssessment.skillDecay] : [],
                    mitigationSteps: response.riskAssessment.marketCompetition ? [response.riskAssessment.marketCompetition] : []
                },
                steps: {
                    create: response.aiRoadmap.flatMap((category: Category) => 
                        category.tasks.map((task: Task) => ({
                            title: task.title,
                            description: task.description,
                            timeframe: task.urgency || 'not specified',
                            priority: task.priority === 'critical' ? 'high' : task.priority || 'medium',
                            status: "NOT_STARTED",
                            timelineProgress: 0,
                            skillType: task.skillType || 'technical',
                            category: category.category,
                            successMetrics: task.successMetrics || [],
                            resources: {
                                create: (task.resources || []).map((resource: Resource) => ({
                                    name: resource.name || '',
                                    url: resource.url || '',
                                    description: resource.description || '',
                                    type: resource.type || 'article',
                                    provider: resource.provider || 'General',
                                    level: resource.level || 'beginner',
                                    aiRelevance: resource.aiRelevance || 'foundational',
                                    timeCommitment: resource.timeCommitment || '1-2 hours',
                                    category: resource.provider || 'General',
                                    tags: resource.aiRelevance || '',
                                    isFree: true,
                                    isPremium: false
                                }))
                            }
                        }))
                    )
                }
            }
        });

        return NextResponse.json(response);
    } catch (error: unknown) {
        console.error('Error in career analysis:', error);
        return NextResponse.json({
            error: 'Failed to generate analysis',
            details: error instanceof Error ? error.message : 'Unknown error',
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
                atRiskSkills: [],
                crossTraining: [],
                industryOpportunities: []
            },
            certificationPath: [],
            projectRecommendations: [],
            communityStrategy: {
                networkingTargets: [],
                contributionOpportunities: [],
                mentorshipRecommendations: []
            },
            riskAssessment: {
                automationThreat: "low",
                skillDecay: "none",
                marketCompetition: "unknown"
            }
        }, { status: 500 });
    }
} 