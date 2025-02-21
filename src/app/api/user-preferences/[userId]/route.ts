import { prisma } from '../../../../config/prisma';
import { NextRequest, NextResponse } from 'next/server';

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

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                preferences
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error: unknown) {
        console.error('Error updating preferences:', error);
        return NextResponse.json({ 
            error: 'Failed to update preferences',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 