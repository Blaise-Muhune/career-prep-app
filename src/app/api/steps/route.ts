import { prisma } from '../../../config/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Step, StepProgress } from '@prisma/client';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // Get the most recent career analysis first
        const recentAnalysis = await prisma.careerAnalysis.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                steps: true
            }
        });

        // If no analysis exists, return empty array
        if (!recentAnalysis) {
            return NextResponse.json([]);
        }

        // Get progress for all steps
        const stepProgress = await prisma.stepProgress.findMany({
            where: {
                userId,
                stepId: {
                    in: recentAnalysis.steps.map((step: Step) => step.id)
                }
            }
        });

        // Create a map of step progress by step ID
        const progressMap = new Map(
            stepProgress.map((progress: StepProgress) => [progress.stepId, progress])
        );

        // Combine steps with their progress
        const stepsWithProgress = recentAnalysis.steps.map((step: Step) => ({
            ...step,
            progress: progressMap.get(step.id) || {
                status: "NOT_STARTED",
                startedAt: null,
                completedAt: null
            }
        }));

        return NextResponse.json(stepsWithProgress);
    } catch (error: unknown) {
        console.error('Error fetching steps:', error);
        // Return a more detailed error response
        return NextResponse.json({ 
            error: 'Failed to fetch steps',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        }, { status: 500 });
    }
} 