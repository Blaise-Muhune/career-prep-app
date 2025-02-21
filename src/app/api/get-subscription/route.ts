import { prisma } from '../../../config/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
            select: {
                status: true,
                plan: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
                canceledAt: true,
                active: true
            }
        });

        if (!subscription) {
            // Return a default response for users without a subscription
            return NextResponse.json({
                status: 'inactive',
                plan: 'Free',
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
                active: false
            });
        }

        return NextResponse.json(subscription);
    } catch (error: unknown) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 