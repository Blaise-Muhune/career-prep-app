# Migration from Prisma to Firebase Firestore

This document outlines the migration process from Prisma/PostgreSQL to Firebase Firestore for the Career Prep App.

## What Changed

### Database Layer
- **Before**: Prisma ORM with PostgreSQL database
- **After**: Firebase Firestore with direct Firestore SDK calls

### Key Changes Made

1. **Removed Prisma Dependencies**
   - Removed `@prisma/client`, `prisma`, and related packages
   - Deleted `prisma/schema.prisma` and `src/config/prisma.ts`

2. **Updated Firebase Configuration**
   - Enhanced `src/firebaseConfig.ts` to include Firestore
   - Added `getFirestore()` export

3. **Created Firestore Utilities**
   - New file: `src/lib/firestore.ts`
   - Contains all type definitions and CRUD operations
   - Provides generic functions for common database operations

4. **Updated API Routes**
   - `src/app/api/get-user/route.ts` - Now uses Firestore
   - `src/app/api/create-user/route.ts` - Now uses Firestore
   - `src/app/api/structure-profile/route.ts` - Now uses Firestore

5. **Migration Script**
   - Created `src/lib/migration.ts` to help migrate existing data
   - Handles all data types and relationships

## New Data Structure

### Collections in Firestore
- `users` - User accounts and basic info
- `profiles` - User profiles with skills and preferences
- `tasks` - User tasks and to-dos
- `careerAnalyses` - AI-generated career analysis
- `steps` - Individual steps in career roadmap
- `resources` - Learning resources for each step
- `stepProgress` - User progress tracking
- `notifications` - User notifications
- `subscriptions` - Stripe subscription data
- `invoices` - Stripe invoice data

### Key Differences from Prisma
- **No Auto-increment IDs**: Firestore uses auto-generated string IDs
- **No Relations**: Firestore doesn't have built-in relations like Prisma
- **Document-based**: Data is stored as documents rather than relational tables
- **No Migrations**: Schema changes are handled in code

## How to Use

### Basic CRUD Operations

```typescript
import { createDocument, getDocument, updateDocument, deleteDocument } from '../lib/firestore';

// Create a new user
const userId = await createDocument<User>('users', {
  email: 'user@example.com',
  name: 'John Doe',
  dreamJob: 'Software Engineer'
});

// Get a user
const user = await getDocument<User>('users', userId);

// Update a user
await updateDocument<User>('users', userId, { name: 'Jane Doe' });

// Delete a user
await deleteDocument('users', userId);
```

### Querying Data

```typescript
import { getDocumentsByField, getDocuments } from '../lib/firestore';

// Get all users with a specific email
const users = await getDocumentsByField<User>('users', 'email', 'user@example.com');

// Get documents with conditions
const tasks = await getDocuments<Task>('tasks', [
  { field: 'userId', operator: '==', value: userId },
  { field: 'completed', operator: '==', value: false }
], 'dueDate', 'asc');
```

## Migration Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Firebase
- Ensure your Firebase project is configured
- Update `src/firebaseConfig.ts` with your Firebase credentials
- Enable Firestore in your Firebase console

### 3. Run the App
```bash
npm run dev
```

### 4. Data Migration (Optional)
If you have existing data to migrate:

```typescript
import { migrateToFirestore } from './lib/migration';

// Prepare your data in the expected format
const migrationData = {
  users: [...],
  profiles: [...],
  // ... other collections
};

// Run the migration
await migrateToFirestore(migrationData);
```

## Benefits of Firestore

1. **Scalability**: Automatic scaling with usage
2. **Real-time Updates**: Built-in real-time listeners
3. **Offline Support**: Works offline with automatic sync
4. **Security**: Row-level security rules
5. **Cost**: Pay-per-use pricing model
6. **Integration**: Seamless integration with other Firebase services

## Security Rules

Remember to set up proper Firestore security rules in your Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /profiles/{profileId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Add more rules as needed
  }
}
```

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure you're using the correct types from `firestore.ts`
2. **Permission Denied**: Check your Firestore security rules
3. **Missing Fields**: Verify all required fields are provided when creating documents

### Debugging

- Check browser console for Firestore errors
- Use Firebase console to inspect data
- Enable Firestore logging in development

## Next Steps

1. **Test all API endpoints** to ensure they work with Firestore
2. **Update frontend components** if they expect different data structures
3. **Set up Firestore security rules** for production
4. **Monitor performance** and optimize queries as needed
5. **Consider implementing caching** for frequently accessed data

## Support

If you encounter issues during migration:
1. Check the Firebase documentation
2. Review the Firestore console for errors
3. Verify your Firebase configuration
4. Check the browser console for detailed error messages
