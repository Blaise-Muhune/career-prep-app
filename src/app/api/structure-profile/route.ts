import { prisma } from '../../../../api/config/prisma.js';
import { openai } from '../../../../api/config/openai.js';
import { NextRequest, NextResponse } from 'next/server';
import { Task, Skill, StepProgress } from '@prisma/client';

interface TaskResponse {
    title: string;
    description: string;
    timeframe: string;
    priority: string;
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

        // Calculate progress
        const totalTasks = userData.tasks?.length || 0;
        const completedTasks = userData.tasks?.filter((task: Task) => task.completed)?.length || 0;
        const preexistingSkills = userData.profile?.skills?.length || 0;

        // Calculate step progress
        const totalSteps = recentAnalysis?.steps?.length || 0;
        const completedSteps = userData.stepProgress?.filter((sp: StepProgress) => sp.status === 'COMPLETED')?.length || 0;
        
        // Calculate app progress based on both tasks and steps
        const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 30 : 0; // 30% weight for tasks
        const stepProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 30 : 0; // 30% weight for steps

        const progressBreakdown = {
            preexistingExperience: Math.min(preexistingSkills * 10, 40), // Cap at 40%
            appProgress: Math.min(taskProgress + stepProgress, 60), // Cap at 60%
            totalProgress: 0
        };

        progressBreakdown.totalProgress = Math.min(
            progressBreakdown.preexistingExperience + progressBreakdown.appProgress,
            100
        );

        if (recentAnalysis) {
            return NextResponse.json({
                ...JSON.parse(recentAnalysis.analysis),
                progressBreakdown
            });
        }

        const bio = userData.profile?.bio || 'Not provided';
        const dreamJob = userData.profile?.dreamJob || 'Not specified';
        const skills = userData.profile?.skills?.map((s: Skill) => s.name).join(', ') || 'None listed';

        // Create the analysis
        const prompt = `
            Analyze my career profile and provide a structured response:
            
            Current Profile:
            - Dream Job: ${dreamJob}
            - Current Skills: ${skills}
            - Bio/Resume: ${bio}
            - Completed Tasks: ${completedTasks} out of ${totalTasks} tasks

            Progress Breakdown:
            - Pre-existing Experience: ${progressBreakdown.preexistingExperience}%
            - App Progress: ${progressBreakdown.appProgress}%
            - Total Progress: ${progressBreakdown.totalProgress}%

            Provide your response in the following JSON format:
            {
                "progressPercentage": number between 0-100,
                "tasks": [
                    {
                        "title": "task title",
                        "description": "detailed description",
                        "timeframe": "estimated time to complete",
                        "priority": "high/medium/low",
                        "resources": [
                            {
                                "name": "resource name",
                                "url": "resource url (if applicable)",
                                "description": "description of the resource",
                                "type": "article/video/podcast/book/course/etc.",
                                "category": "category of the resource",
                                "tags": "tags for the resource",
                                "isFree": true,
                                "isPremium": false
                            }
                        ]
                    }
                ],
                "analysis": "brief explanation of the progress evaluation"
            }
        `;

        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "You are a career advisor that provides structured JSON responses with specific, actionable career development plans on how to adapt the user in the job market of artificial intelligence raising at a rapid rate. Each task should include an array of learning resources to help the user complete the task. Always ensure resources is an array, even if empty []." 
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
            // If OpenAI fails, return a default response with the progress data
            return NextResponse.json({
                progressPercentage: progressBreakdown.totalProgress,
                progressBreakdown,
                tasks: [],
                analysis: "Unable to generate analysis at this time. Please try again later."
            });
        }

        const response = JSON.parse(completion.choices[0].message.content);
        response.progressBreakdown = progressBreakdown;

        // Ensure each task has a resources array
        response.tasks = response.tasks.map((task: TaskResponse) => ({
            ...task,
            resources: Array.isArray(task.resources) ? task.resources : []
        }));

        // Save the analysis
        await prisma.careerAnalysis.create({
            data: {
                userId,
                analysis: JSON.stringify(response),
                steps: {
                    create: response.tasks.map((task: TaskResponse) => ({
                        title: task.title,
                        description: task.description,
                        timeframe: task.timeframe,
                        priority: task.priority,
                        status: "NOT_STARTED",
                        timelineProgress: 0,
                        resources: {
                            create: task.resources
                        }
                    }))
                }
            }
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error in career analysis:', error);
        
        // Return a default response with basic progress data
        return NextResponse.json({
            progressPercentage: 0,
            progressBreakdown: {
                preexistingExperience: 0,
                appProgress: 0,
                totalProgress: 0
            },
            tasks: [],
            analysis: "Unable to generate analysis at this time. Please try again later."
        }, { status: 200 }); // Return 200 with default data instead of error
    }
} 