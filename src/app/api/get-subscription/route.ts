import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsByField, Subscription } from '../../../lib/firestore';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const subscriptions = await getDocumentsByField<Subscription>('subscriptions', 'userId', userId);
        const subscription = subscriptions.length > 0 ? subscriptions[0] : null;

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

        return NextResponse.json({
            status: subscription.status,
            plan: subscription.plan,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
            active: subscription.active
        });
    } catch (error: unknown) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 