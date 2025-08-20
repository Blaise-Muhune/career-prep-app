import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsByField, CareerAnalysis, Step } from '../../../lib/firestore';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const analyses = await getDocumentsByField<CareerAnalysis>('careerAnalyses', 'userId', userId);
        
        // Get steps for each analysis
        const analysesWithSteps = await Promise.all(
            analyses.map(async (analysis) => {
                const steps = await getDocumentsByField<Step>('steps', 'analysisId', analysis.id);
                return {
                    ...analysis,
                    steps
                };
            })
        );

        // Sort by creation date (newest first)
        const sortedAnalyses = analysesWithSteps.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json(sortedAnalyses);
    } catch (error: unknown) {
        console.error('Error fetching career analyses:', error);
        return NextResponse.json({
            error: 'Failed to fetch career analyses',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get the most recent analysis
        const recentAnalyses = await getDocumentsByField<CareerAnalysis>('careerAnalyses', 'userId', userId);
        
        if (recentAnalyses.length === 0) {
            return NextResponse.json({ 
                error: 'No career analysis found',
                message: 'Please use the structure-profile endpoint to generate a new analysis'
            }, { status: 404 });
        }

        // Sort by creation date and get the most recent
        const recentAnalysis = recentAnalyses.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        // Check if it's from the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (recentAnalysis.createdAt < twentyFourHoursAgo) {
            return NextResponse.json({ 
                error: 'No recent career analysis found',
                message: 'Please use the structure-profile endpoint to generate a new analysis'
            }, { status: 404 });
        }

        // Get steps for this analysis
        const steps = await getDocumentsByField<Step>('steps', 'analysisId', recentAnalysis.id);

        return NextResponse.json({
            ...JSON.parse(recentAnalysis.analysis),
            steps
        });
    } catch (error: unknown) {
        console.error('Error in career analysis:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch career analysis',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 