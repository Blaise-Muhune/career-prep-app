import { prisma } from '../../../../api/config/prisma.js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Mark all unread notifications as read
        await prisma.notification.updateMany({
            where: {
                userId,
                read: false
            },
            data: {
                read: true
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({ 
            error: 'Failed to mark notifications as read',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 