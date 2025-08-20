# Firebase Setup Guide

## 1. Firebase Project Configuration

To complete the migration to Firebase, you need to update your Firebase configuration:

### Update `src/firebaseConfig.ts`

Replace the existing configuration with your actual Firebase project details:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## 2. Enable Firestore

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. In the left sidebar, click "Firestore Database"
4. Click "Create database"
5. Choose "Start in test mode" for development (you can secure it later)
6. Select a location for your database

## 3. Set Up Security Rules

In your Firestore console, go to "Rules" and set up basic security rules:

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
    
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /careerAnalyses/{analysisId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /steps/{stepId} {
      allow read, write: if request.auth != null;
    }
    
    match /resources/{resourceId} {
      allow read, write: if request.auth != null;
    }
    
    match /stepProgress/{progressId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 4. Test Your Setup

Run the test script to verify Firestore is working:

```bash
# In development, you can test the connection
npm run dev
# Then check the console for any Firestore errors
```

## 5. Environment Variables

Make sure you have these environment variables set in your `.env.local` file:

```bash
# Firebase (these should match your firebaseConfig)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenAI (for career analysis)
OPENAI_API_KEY=your_openai_api_key

# Stripe (if using subscriptions)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 6. Verify Collections

After running your app, you should see these collections created in Firestore:

- `users`
- `profiles`
- `tasks`
- `careerAnalyses`
- `steps`
- `resources`
- `stepProgress`
- `notifications`
- `subscriptions`
- `invoices`

## 7. Troubleshooting

### Common Issues:

1. **Permission Denied**: Check your Firestore security rules
2. **Collection Not Found**: Collections are created automatically when you first add documents
3. **Authentication Errors**: Ensure Firebase Auth is properly configured
4. **Network Errors**: Check your internet connection and Firebase project status

### Debug Steps:

1. Check browser console for errors
2. Verify Firebase configuration in `firebaseConfig.ts`
3. Check Firestore console for any permission issues
4. Ensure your Firebase project is on the correct plan (Blaze plan required for some features)

## 8. Next Steps

Once Firestore is working:

1. Test all API endpoints
2. Verify data is being stored correctly
3. Set up proper security rules for production
4. Consider implementing offline support
5. Set up monitoring and alerts in Firebase console

## 9. Production Considerations

- **Security Rules**: Tighten security rules before going to production
- **Indexes**: Create composite indexes for complex queries
- **Backup**: Set up automated backups
- **Monitoring**: Enable Firebase monitoring and alerts
- **Cost**: Monitor usage and costs in Firebase console
