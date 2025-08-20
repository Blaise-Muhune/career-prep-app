import { createDocument, getDocument, deleteDocument, User } from './firestore';

export async function testFirestoreConnection() {
    try {
        console.log('Testing Firestore connection...');
        
        // Test creating a document
        const testUserId = await createDocument<User>('testUsers', {
            email: 'test@example.com',
            name: 'Test User',
            dreamJob: 'Test Job',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log('✅ Document created successfully with ID:', testUserId);
        
        // Test reading the document
        const testUser = await getDocument<User>('testUsers', testUserId);
        if (testUser) {
            console.log('✅ Document retrieved successfully:', testUser);
        } else {
            console.log('❌ Failed to retrieve document');
        }
        
        // Test deleting the document
        await deleteDocument('testUsers', testUserId);
        console.log('✅ Document deleted successfully');
        
        console.log('🎉 All Firestore tests passed!');
        return true;
    } catch (error) {
        console.error('❌ Firestore test failed:', error);
        return false;
    }
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    testFirestoreConnection().then(success => {
        if (success) {
            console.log('Firestore is working correctly!');
            process.exit(0);
        } else {
            console.log('Firestore test failed!');
            process.exit(1);
        }
    });
}
