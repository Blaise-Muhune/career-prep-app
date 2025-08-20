import { NextResponse } from 'next/server';
import { db } from '../../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
    try {
        console.log('Testing Firestore connection...');
        
        // Test basic Firestore connection
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        
        console.log('Firestore connection successful');
        
        return NextResponse.json({ 
            success: true, 
            message: 'Firestore connection working',
            collections: ['test'],
            timestamp: new Date().toISOString()
        });
        
    } catch (error: unknown) {
        console.error('Firestore connection failed:', error);
        
        return NextResponse.json({ 
            success: false,
            error: 'Firestore connection failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
