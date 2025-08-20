import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsByField, Notification } from '../../../lib/firestore';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        console.log('Fetching notifications for user:', userId);
        
        const notifications = await getDocumentsByField<Notification>('notifications', 'userId', userId);
        console.log('Found notifications:', notifications.length);
        
        // Filter notifications from the last 30 days and sort by date
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentNotifications = notifications
            .filter(notification => notification.date >= thirtyDaysAgo)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log('Returning filtered notifications:', recentNotifications.length);
        return NextResponse.json(recentNotifications);
    } catch (error: unknown) {
        console.error('Error fetching notifications:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            userId,
            timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({ 
            error: 'Failed to fetch notifications',
            details: error instanceof Error ? error.message : 'Unknown error',
            userId,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 