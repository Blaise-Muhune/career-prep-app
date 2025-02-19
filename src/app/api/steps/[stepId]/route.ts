import { prisma } from '../../../../../api/config/prisma.js';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
    params: Promise<{
        stepId: string;
    }>;
};

export const GET = async (
    request: NextRequest,
    context: RouteContext
) => {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const { stepId } = await context.params;
        const stepIdNum = parseInt(stepId);
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (isNaN(stepIdNum)) {
            return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });
        }

        // Get the step and check if it belongs to the user's career analysis
        const step = await prisma.step.findFirst({
            where: {
                id: stepIdNum,
                careerAnalysis: {
                    userId
                }
            },
            include: {
                resources: true
            }
        });

        if (!step) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        // Get the user's progress for this step
        const stepProgress = await prisma.stepProgress.findUnique({
            where: {
                userId_stepId: {
                    userId,
                    stepId: stepIdNum
                }
            }
        });

        // Combine step data with progress
        const stepWithProgress = {
            ...step,
            status: stepProgress?.status || 'NOT_STARTED',
            startedAt: stepProgress?.startedAt || null,
            completedAt: stepProgress?.completedAt || null
        };

        return NextResponse.json(stepWithProgress);
    } catch (error: any) {
        console.error('Error fetching step:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch step',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
};

export const PATCH = async (
    request: NextRequest,
    context: RouteContext
) => {
    try {
        const body = await request.json();
        const { userId, status, timelineProgress } = body;
        const { stepId } = await context.params;
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
                    timelineProgress: timelineProgress || 0
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
    } catch (error: any) {
        console.error('Error updating step:', error);
        return NextResponse.json({ 
            error: 'Failed to update step',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
}; 