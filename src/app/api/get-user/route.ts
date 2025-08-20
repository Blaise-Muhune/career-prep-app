import { NextRequest, NextResponse } from 'next/server';
import { 
  getDocument, 
  getDocumentsByField, 
  User, 
  Profile, 
  Task, 
  StepProgress,
  convertTimestamp 
} from '../../../lib/firestore';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    try {
      console.log('Looking for user with ID:', userId);
      
      // Get user data
      const user = await getDocument<User>('users', userId);
      console.log('User found:', user);
      
      if (!user) {
        console.log('User not found in database');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get user profile
      const profiles = await getDocumentsByField<Profile>('profiles', 'userId', userId);
      const profile = profiles.length > 0 ? profiles[0] : null;

      // Get user tasks
      const tasks = await getDocumentsByField<Task>('tasks', 'userId', userId);
      const activeTasks = tasks
        .filter(task => !task.completed)
        .sort((a, b) => convertTimestamp(a.dueDate).getTime() - convertTimestamp(b.dueDate).getTime());

      // Get step progress
      const stepProgress = await getDocumentsByField<StepProgress>('stepProgress', 'userId', userId);
      const sortedStepProgress = stepProgress.sort((a, b) => a.stepId.localeCompare(b.stepId));

      // Format the response to include only necessary data
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        dreamJob: user.dreamJob,
        preferences: user.preferences || null,
        profile: profile ? {
          bio: profile.bio,
          dreamJob: profile.dreamJob,
          dreamCompany: profile.dreamCompany,
          dreamSalary: profile.dreamSalary,
          skills: profile.skills || []
        } : null,
        tasks: activeTasks.map(task => ({
          id: task.id,
          title: task.title,
          dueDate: convertTimestamp(task.dueDate),
          completed: task.completed
        })),
        stepProgress: sortedStepProgress.map(progress => ({
          ...progress,
          startedAt: progress.startedAt ? convertTimestamp(progress.startedAt) : undefined,
          completedAt: progress.completedAt ? convertTimestamp(progress.completedAt) : undefined
        }))
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