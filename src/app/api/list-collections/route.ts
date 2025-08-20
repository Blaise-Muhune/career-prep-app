import {  NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export async function GET() {
    try {
        console.log('Listing all collections...');
        
        // Get all collections
        const collections = ['users', 'profiles', 'careerAnalyses', 'steps', 'stepProgress', 'tasks'];
        const result: Record<string, unknown> = {};
        
        for (const collectionName of collections) {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const docs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                result[collectionName] = docs;
                console.log(`Collection ${collectionName}: ${docs.length} documents`);
            } catch (error) {
                console.error(`Error getting collection ${collectionName}:`, error);
                result[collectionName] = { error: 'Failed to fetch' };
            }
        }
        
        return NextResponse.json({
            success: true,
            collections: result
        });
        
    } catch (error: unknown) {
        console.error('Error listing collections:', error);
        return NextResponse.json({ 
            error: 'Failed to list collections',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
