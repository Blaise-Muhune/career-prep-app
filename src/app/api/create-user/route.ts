import { NextRequest, NextResponse } from 'next/server';
import { 
  getDocumentsByField, 
  createDocument, 
  updateDocument, 
  User, 
  Profile,
 
} from '../../../lib/firestore';

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

        // Check if user exists by email
        const existingUsers = await getDocumentsByField<User>('users', 'email', email);
        const existingUser = existingUsers.length > 0 ? existingUsers[0] : null;

        // Add debug logging for the user creation/update
        console.log('Creating/updating user with ID:', id);

        let user: User;
        if (existingUser) {
            console.log('Updating existing user:', existingUser.id);
            await updateDocument<User>('users', existingUser.id, {
                name,
                dreamJob: dreamJob || 'Unknown'
            });
            user = { ...existingUser, name, dreamJob: dreamJob || 'Unknown' };
        } else {
            console.log('Creating new user with ID:', id);
            const userId = await createDocument<User>('users', {
                email,
                name,
                dreamJob: dreamJob || 'Unknown',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            user = {
                id: userId,
                email,
                name,
                dreamJob: dreamJob || 'Unknown',
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        // Log the created/updated user
        console.log('User after creation/update:', user);

        // Handle profile
        const existingProfiles = await getDocumentsByField<Profile>('profiles', 'userId', user.id);
        let profile: Profile;

        if (existingProfiles.length > 0) {
            // Update existing profile
            const existingProfile = existingProfiles[0];
            await updateDocument<Profile>('profiles', existingProfile.id, {
                bio,
                dreamJob,
                dreamCompany,
                dreamSalary,
                skills: skills?.map((skill: string) => ({
                    id: `${existingProfile.id}_${skill}`,
                    name: skill,
                    profileId: existingProfile.id
                })) || []
            });
            profile = { ...existingProfile, bio, dreamJob, dreamCompany, dreamSalary };
        } else {
            // Create new profile
            const profileId = await createDocument<Profile>('profiles', {
                userId: user.id,
                bio,
                dreamJob,
                dreamCompany,
                dreamSalary,
                skills: skills?.map((skill: string) => ({
                    id: `${user.id}_${skill}`,
                    name: skill,
                    profileId: user.id
                })) || []
            });
            profile = {
                id: profileId,
                userId: user.id,
                bio,
                dreamJob,
                dreamCompany,
                dreamSalary,
                skills: skills?.map((skill: string) => ({
                    id: `${user.id}_${skill}`,
                    name: skill,
                    profileId: user.id
                })) || []
            };
        }

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
            stack: error instanceof Error ? error.stack : 'Unknown error'
        });
        
        return NextResponse.json({
            error: 'Failed to create/update user',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 