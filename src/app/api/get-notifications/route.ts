import { prisma } from '../../../../api/config/prisma.js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: { 
                userId,
                // Only get notifications from the last 30 days
                date: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(notifications);
    } catch (error: unknown) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch notifications',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 