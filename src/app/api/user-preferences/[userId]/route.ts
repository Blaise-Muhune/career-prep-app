import { NextRequest, NextResponse } from 'next/server';
import { updateDocument, getDocument, User } from '../../../../lib/firestore';

type RouteContext = {
    params: Promise<{
        userId: string;
    }>;
};

export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { userId } = await context.params;
        const body = await request.json();
        const { preferences } = body;

        if (!preferences) {
            return NextResponse.json({ error: 'Preferences are required' }, { status: 400 });
        }

        // Update user preferences
        await updateDocument<User>('users', userId, { preferences });

        // Get the updated user to return
        const updatedUser = await getDocument<User>('users', userId);
        
        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error: unknown) {
        console.error('Error updating preferences:', error);
        return NextResponse.json({ 
            error: 'Failed to update preferences',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 