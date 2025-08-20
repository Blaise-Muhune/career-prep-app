import { NextRequest, NextResponse } from 'next/server';
import { 
    getDocument, 
    getDocumentsByField, 
    updateDocument, 
    createDocument,
    Step, 
    StepProgress, 
    CareerAnalysis,
    Resource
} from '../../../../lib/firestore';

interface Category {
    category: string;
    tasks: {
        title: string;
        skillType?: string;
        successMetrics?: string[];
        urgency?: string;
    }[];
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ stepId: string }> }
) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const { stepId } = await params;
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get the step
        const step = await getDocument<Step>('steps', stepId);
        
        if (!step) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        // Get the career analysis to verify ownership
        const analysis = await getDocument<CareerAnalysis>('careerAnalyses', step.analysisId);
        
        if (!analysis || analysis.userId !== userId) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        // Get the user's progress for this step
        const stepProgresses = await getDocumentsByField<StepProgress>('stepProgress', 'stepId', stepId);
        const stepProgress = stepProgresses.find(progress => progress.userId === userId);

        // Get resources for this step
        const resources = await getDocumentsByField<Resource>('resources', 'stepId', stepId);

        // Parse the analysis to get additional step data
        const analysisData = JSON.parse(analysis.analysis);
        const stepCategory = analysisData.aiRoadmap.find((category: Category) => 
            category.tasks.some((task: { title: string }) => task.title === step.title)
        );
        const stepDetails = stepCategory?.tasks.find((task: { title: string }) => task.title === step.title);

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
            resources: resources.map((resource: Resource) => ({
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

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Verify the step exists and belongs to the user
        const step = await getDocument<Step>('steps', stepId);
        
        if (!step) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        // Get the career analysis to verify ownership
        const analysis = await getDocument<CareerAnalysis>('careerAnalyses', step.analysisId);
        
        if (!analysis || analysis.userId !== userId) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        // Update the step's status and timeline progress
        const now = new Date();
        await updateDocument<Step>('steps', stepId, {
            status: status,
            timelineProgress: timelineProgress || 0,
            startedAt: status === 'IN_PROGRESS' ? now : undefined,
            completedAt: status === 'COMPLETED' ? now : undefined
        });

        // Get or create step progress
        const stepProgresses = await getDocumentsByField<StepProgress>('stepProgress', 'stepId', stepId);
        const existingProgress = stepProgresses.find(progress => progress.userId === userId);

        let stepProgress: StepProgress;
        if (existingProgress) {
            // Update existing progress
            await updateDocument<StepProgress>('stepProgress', existingProgress.id, {
                status: status,
                startedAt: status === 'IN_PROGRESS' ? now : undefined,
                completedAt: status === 'COMPLETED' ? now : undefined
            });
            stepProgress = { ...existingProgress, status, startedAt: status === 'IN_PROGRESS' ? now : undefined, completedAt: status === 'COMPLETED' ? now : undefined };
        } else {
            // Create new progress
            const progressId = await createDocument<StepProgress>('stepProgress', {
                userId,
                stepId,
                status: status,
                startedAt: status === 'IN_PROGRESS' ? now : undefined,
                completedAt: status === 'COMPLETED' ? now : undefined
            });
            stepProgress = {
                id: progressId,
                userId,
                stepId,
                status,
                startedAt: status === 'IN_PROGRESS' ? now : undefined,
                completedAt: status === 'COMPLETED' ? now : undefined
            };
        }

        // Get the updated step
        const updatedStep = await getDocument<Step>('steps', stepId);

        // Return the updated step with progress
        const result = {
            ...updatedStep,
            progress: stepProgress
        };

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Error updating step:', error);
        return NextResponse.json({ 
            error: 'Failed to update step',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 