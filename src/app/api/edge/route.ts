import { NextResponse } from 'next/server'
import { getDocuments, User } from '../../../lib/firestore'

export const runtime = 'edge'

export async function GET(request: Request) {
    console.log(request)
    
    try {
        // Get all users from Firestore
        // Note: In a real app, you might want to limit this or add authentication
        const users = await getDocuments<User>('users');
        
        return NextResponse.json(users, { status: 200 })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}