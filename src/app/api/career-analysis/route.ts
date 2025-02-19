import { prisma } from '../../../../api/config/prisma.js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const analyses = await prisma.careerAnalysis.findMany({
            where: { userId },
            include: {
                steps: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(analyses);
    } catch (error: any) {
        console.error('Error fetching career analyses:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch career analyses',
            details: error.message || 'Unknown error'
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
        const recentAnalysis = await prisma.careerAnalysis.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            },
            include: {
                steps: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (recentAnalysis) {
            return NextResponse.json({
                ...JSON.parse(recentAnalysis.analysis),
                steps: recentAnalysis.steps
            });
        }

        // If no recent analysis, return 404
        return NextResponse.json({ 
            error: 'No recent career analysis found',
            message: 'Please use the structure-profile endpoint to generate a new analysis'
        }, { status: 404 });
    } catch (error: any) {
        console.error('Error in career analysis:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch career analysis',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
} 