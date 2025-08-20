import { NextRequest, NextResponse } from 'next/server';
import { createDocument, Notification } from '../../../lib/firestore';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, type, message, stepId } = body;

        if (!userId || !type || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const notificationId = await createDocument<Notification>('notifications', {
            userId,
            type,
            message,
            stepId,
            date: new Date(),
            read: false
        });

        // Get the created notification to return
        const notification = {
            id: notificationId,
            userId,
            type,
            message,
            stepId,
            date: new Date(),
            read: false
        };

        return NextResponse.json(notification);
    } catch (error: unknown) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ 
            error: 'Failed to create notification',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 