import { NextResponse } from 'next/server';
import { prisma } from '../config/prisma.js';

export async function GET(
  request: Request,
  { params }: { params: { stepId: string } }
) {
  const stepId = parseInt(params.stepId, 10);
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId || !stepId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const stepProgress = await prisma.stepProgress.findUnique({
      where: {
        userId_stepId: {
          userId,
          stepId
        }
      }
    });

    const recentAnalysis = await prisma.careerAnalysis.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });

    if (!recentAnalysis) {
      return NextResponse.json({ error: 'No career analysis found' }, { status: 404 });
    }

    const analysis = JSON.parse(recentAnalysis.analysis);
    const stepIndex = stepId - 1;
    const step = analysis.tasks[stepIndex];
    
    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    // Calculate timeline progress if step is started
    let timelineProgress = 0;
    let status = 'NOT_STARTED';
    
    if (stepProgress?.startedAt) {
      const startDate = new Date(stepProgress.startedAt);
      const timeframe = parseDuration(step.timeframe); // Helper function to parse "2 weeks", "1 month", etc.
      const endDate = new Date(startDate.getTime() + timeframe);
      const now = new Date();
      
      if (stepProgress.completedAt) {
        status = 'COMPLETED';
        timelineProgress = 100;
      } else {
        status = 'IN_PROGRESS';
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        timelineProgress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
      }
    }
    
    return NextResponse.json({
      id: stepId,
      title: step.title,
      description: step.description,
      timeframe: step.timeframe,
      priority: step.priority,
      status,
      timelineProgress,
      startedAt: stepProgress?.startedAt || null,
      completedAt: stepProgress?.completedAt || null
    });
  } catch (error) {
    console.error('Error fetching step:', error);
    return NextResponse.json({ error: 'Failed to fetch step details' }, { status: 500 });
  }
}

// Add endpoint to start a step
function parseDuration(timeframe: string) {
  const number = parseInt(timeframe);
  if (timeframe.includes('week')) {
    return number * 7 * 24 * 60 * 60 * 1000;
  } else if (timeframe.includes('month')) {
    return number * 30 * 24 * 60 * 60 * 1000;
  } else if (timeframe.includes('day')) {
    return number * 24 * 60 * 60 * 1000;
  }
  return 14 * 24 * 60 * 60 * 1000; // Default to 2 weeks
}
