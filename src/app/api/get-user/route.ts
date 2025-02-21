import { prisma } from '../../../config/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Skill, Task } from '@prisma/client';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              skills: true,
            },
          },
          tasks: {
            where: { completed: false },
            orderBy: { dueDate: 'asc' },
          },
          stepProgress: {
            orderBy: { stepId: 'asc' },
          },
        },
      });
  
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
  
      // Format the response to include only necessary data
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        dreamJob: user.dreamJob,
        preferences: user.preferences || null,
        profile: user.profile ? {
          bio: user.profile.bio,
          dreamJob: user.profile.dreamJob,
          dreamCompany: user.profile.dreamCompany,
          dreamSalary: user.profile.dreamSalary,
          skills: user.profile.skills.map((skill: Skill) => ({
            id: skill.id,
            name: skill.name
          }))
        } : null,
        tasks: user.tasks.map((task: Task) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          completed: task.completed
        })),
        stepProgress: user.stepProgress
      };
  
      return NextResponse.json(userData);
    } catch (error: unknown) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
} 