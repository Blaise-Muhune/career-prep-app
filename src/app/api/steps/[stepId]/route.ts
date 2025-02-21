import { Task } from '@prisma/client';
import { prisma } from '../../../../../api/config/prisma.js';
import { NextRequest, NextResponse } from 'next/server';

interface Category {
    category: string;
    tasks: Task[];
}

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
    stepId: number;
}

interface StepResource extends Resource {
    provider?: string;
    level?: string;
    aiRelevance?: string;
    timeCommitment?: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ stepId: string }> }
) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const { stepId } = await params;
        const stepIdNum = parseInt(stepId);
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (isNaN(stepIdNum)) {
            return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });
        }

        // Get the most recent career analysis first
        const recentAnalysis = await prisma.careerAnalysis.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                steps: {
                    where: { id: stepIdNum },
                    include: {
                        resources: true
                    }
                }
            }
        });

        if (!recentAnalysis || !recentAnalysis.steps.length) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        const step = recentAnalysis.steps[0];

        // Get the user's progress for this step
        const stepProgress = await prisma.stepProgress.findUnique({
            where: {
                userId_stepId: {
                    userId,
                    stepId: stepIdNum
                }
            }
        });

        // Parse the analysis to get additional step data
        const analysisData = JSON.parse(recentAnalysis.analysis);
        const stepCategory = analysisData.aiRoadmap.find((category: Category) => 
            category.tasks.some((task: Task) => task.title === step.title)
        );
        const stepDetails = stepCategory?.tasks.find((task: Task) => task.title === step.title);

        // Combine step data with progress and additional details
        const stepWithProgress = {
            ...step,
            status: stepProgress?.status || step.status,
            startedAt: stepProgress?.startedAt || step.startedAt,
            completedAt: stepProgress?.completedAt || step.completedAt,
            category: stepCategory?.category || step.category,
            skillType: stepDetails?.skillType || step.skillType,
            successMetrics: stepDetails?.successMetrics || step.successMetrics || [],
            urgency: stepDetails?.urgency || step.timeframe,
            resources: step.resources.map((resource: StepResource) => ({
                ...resource,
                provider: resource.provider || 'General',
                level: resource.level || 'beginner',
                aiRelevance: resource.aiRelevance || 'foundational',
                timeCommitment: resource.timeCommitment || '1-2 hours'
            }))
        };

        return NextResponse.json(stepWithProgress);
    } catch (error: unknown) {
        console.error('Error fetching step:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch step',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ stepId: string }> }
) {
    try {
        const body = await request.json();
        const { userId, status, timelineProgress } = body;
        const { stepId } = await params;
        const stepIdNum = parseInt(stepId);

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (isNaN(stepIdNum)) {
            return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });
        }

        // Verify the step exists and belongs to the user
        const step = await prisma.step.findFirst({
            where: {
                id: stepIdNum,
                careerAnalysis: {
                    userId
                }
            }
        });

        if (!step) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        // Update both step and step progress in a transaction
        const now = new Date();
        const result = await prisma.$transaction([
            // Update the step's status and timeline progress
            prisma.step.update({
                where: { id: stepIdNum },
                data: {
                    status: status,
                    timelineProgress: timelineProgress || 0,
                    startedAt: status === 'IN_PROGRESS' ? now : undefined,
                    completedAt: status === 'COMPLETED' ? now : undefined
                }
            }),
            // Update or create the step progress
            prisma.stepProgress.upsert({
                where: {
                    userId_stepId: {
                        userId,
                        stepId: stepIdNum
                    }
                },
                create: {
                    userId,
                    stepId: stepIdNum,
                    status: status,
                    startedAt: status === 'IN_PROGRESS' ? now : null,
                    completedAt: status === 'COMPLETED' ? now : null
                },
                update: {
                    status: status,
                    startedAt: status === 'IN_PROGRESS' ? now : undefined,
                    completedAt: status === 'COMPLETED' ? now : undefined
                }
            })
        ]);

        // Return the updated step with progress
        const updatedStep = {
            ...result[0],
            progress: result[1]
        };

        return NextResponse.json(updatedStep);
    } catch (error: unknown) {
        console.error('Error updating step:', error);
        return NextResponse.json({ 
            error: 'Failed to update step',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 