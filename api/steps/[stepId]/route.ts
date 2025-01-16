import { NextResponse } from 'next/server';
import {prisma} from '../../config/prisma';

export async function GET(
  request: Request,
  { params }: { params: { stepId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const stepId = parseInt(params.stepId);

    console.log('Fetching step:', { stepId, userId });

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First find the user's career analysis
    const analysis = await prisma.careerAnalysis.findFirst({
      where: { userId },
      include: {
        careerSteps: {
          where: { id: stepId }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Career analysis not found' },
        { status: 404 }
      );
    }

    const step = analysis.careerSteps[0];
    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error('Error fetching step:', error);
    return NextResponse.json(
      { error: 'Failed to fetch step' },
      { status: 500 }
    );
  }
}
