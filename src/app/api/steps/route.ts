import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsByField, Step, StepProgress, CareerAnalysis } from '../../../lib/firestore';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // Get the most recent career analysis first
        const analyses = await getDocumentsByField<CareerAnalysis>('careerAnalyses', 'userId', userId);
        
        if (analyses.length === 0) {
            return NextResponse.json([]);
        }

        // Sort by creation date and get the most recent
        const recentAnalysis = analyses.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        // Get steps for this analysis
        const steps = await getDocumentsByField<Step>('steps', 'analysisId', recentAnalysis.id);

        // Get progress for all steps
        const stepProgress = await getDocumentsByField<StepProgress>('stepProgress', 'userId', userId);

        // Create a map of step progress by step ID
        const progressMap = new Map(
            stepProgress.map((progress: StepProgress) => [progress.stepId, progress])
        );

        // Combine steps with their progress
        const stepsWithProgress = steps.map((step: Step) => ({
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