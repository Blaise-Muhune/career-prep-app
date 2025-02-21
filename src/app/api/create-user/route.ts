import { prisma } from '../../../../api/config/prisma.js';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY): Promise<T> {
    try {
        return await operation();
    } catch (error: unknown) {
        if (retries > 0 && (
            error instanceof Prisma.PrismaClientInitializationError ||
            error instanceof Prisma.PrismaClientKnownRequestError ||
            (error instanceof Error && error.message?.includes('Connection terminated'))
        )) {
            console.log(`Retrying operation, ${retries} attempts remaining`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryOperation(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            id, 
            email, 
            name, 
            bio, 
            skills, 
            dreamJob, 
            dreamCompany, 
            dreamSalary 
        } = body;

        // Validate required fields
        if (!id || !email || !name) {
            console.log('Missing required fields:', { id, email, name });
            return NextResponse.json({
                error: 'Missing required fields',
                required: ['id', 'email', 'name'],
                received: { id, email, name }
            }, { status: 400 });
        }

        // Check if user exists by email with retry
        const existingUser = await retryOperation(async () => 
            prisma.user.findUnique({
                where: { email }
            })
        );

        // Add debug logging for the user creation/update
        console.log('Creating/updating user with ID:', id);

        let user;
        if (existingUser) {
            console.log('Updating existing user:', existingUser.id);
            user = await retryOperation(async () =>
                prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        name,
                        dreamJob: dreamJob || 'Unknown'
                    }
                })
            );
        } else {
            console.log('Creating new user with ID:', id);
            user = await retryOperation(async () =>
                prisma.user.create({
                    data: {
                        id,
                        email,
                        name,
                        dreamJob: dreamJob || 'Unknown'
                    }
                })
            );
        }

        // Log the created/updated user
        console.log('User after creation/update:', user);

        // Handle profile with retry
        const profile = await retryOperation(async () =>
            prisma.profile.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    bio,
                    dreamJob,
                    dreamCompany,
                    dreamSalary,
                    skills: {
                        create: skills?.map((skill: string) => ({
                            name: skill
                        })) || []
                    }
                },
                update: {
                    bio,
                    dreamJob,
                    dreamCompany,
                    dreamSalary,
                    skills: {
                        deleteMany: {},
                        create: skills?.map((skill: string) => ({
                            name: skill
                        })) || []
                    }
                },
                include: {
                    skills: true
                }
            })
        );

        // Return the complete user data
        const userData = {
            ...user,
            profile
        };

        console.log('User created/updated successfully:', userData.id);
        return NextResponse.json(userData, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating/updating user:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'Unknown error',
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'Unknown error'
        });
        
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({
                error: 'Email already exists',
                details: 'A user with this email already exists in the system'
            }, { status: 400 });
        }
        
        return NextResponse.json({
            error: 'Failed to create/update user',
                details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 