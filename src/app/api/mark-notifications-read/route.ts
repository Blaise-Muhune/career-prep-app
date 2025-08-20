import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsByField, updateDocument, Notification } from '../../../lib/firestore';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get all unread notifications for the user
        const unreadNotifications = await getDocumentsByField<Notification>('notifications', 'userId', userId);
        const unreadNotificationsFiltered = unreadNotifications.filter(notification => !notification.read);

        // Mark all unread notifications as read
        const updatePromises = unreadNotificationsFiltered.map(notification =>
            updateDocument<Notification>('notifications', notification.id, { read: true })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({ 
            error: 'Failed to mark notifications as read',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 