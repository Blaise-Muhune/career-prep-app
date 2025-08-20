# Career Prep App

A Next.js application that helps users prepare for their dream careers using AI-powered analysis and personalized roadmaps.

## 🚀 Features

- **AI-Powered Career Analysis**: Get personalized career development plans
- **Skill Gap Analysis**: Identify skills you need to develop
- **Learning Roadmaps**: Step-by-step guidance for career advancement
- **Resource Recommendations**: Curated learning resources and certifications
- **Progress Tracking**: Monitor your career development journey
- **Real-time Updates**: Live progress tracking and notifications

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 18
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **AI Integration**: OpenAI GPT-4 for career analysis
- **Styling**: Tailwind CSS with shadcn/ui components
- **Payments**: Stripe integration for subscriptions

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: OpenAI API
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React hooks
- **Payments**: Stripe

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore enabled
- OpenAI API key
- Stripe account (optional, for subscriptions)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd career-prep-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Firestore Database
4. Set up authentication (Google, Email/Password, etc.)
5. Update `src/firebaseConfig.ts` with your project details
6. Configure Firestore security rules (see `firebase-setup.md`)

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📚 Project Structure

```
career-prep-app/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── profile/        # User profile pages
│   │   └── steps/          # Career steps pages
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   └── ...            # Custom components
│   ├── lib/               # Utility functions and configurations
│   │   ├── firestore.ts   # Firestore utilities
│   │   ├── migration.ts   # Data migration utilities
│   │   └── ...            # Other utilities
│   └── config/            # Configuration files
├── public/                # Static assets
└── ...                   # Configuration files
```

## 🔧 API Endpoints

- `GET /api/get-user` - Get user data and profile
- `POST /api/create-user` - Create or update user
- `POST /api/structure-profile` - Generate AI career analysis
- `GET /api/get-notifications` - Get user notifications
- `GET /api/get-subscription` - Get user subscription status

## 🗄️ Database Collections

- **users** - User accounts and basic info
- **profiles** - User profiles with skills and preferences
- **tasks** - User tasks and to-dos
- **careerAnalyses** - AI-generated career analysis
- **steps** - Individual steps in career roadmap
- **resources** - Learning resources for each step
- **stepProgress** - User progress tracking
- **notifications** - User notifications
- **subscriptions** - Stripe subscription data
- **invoices** - Stripe invoice data

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Docker containers

## 🔒 Security

- Firebase security rules for data access control
- User authentication required for protected routes
- Row-level security in Firestore
- Environment variables for sensitive configuration

## 📖 Documentation

- [Firebase Setup Guide](firebase-setup.md) - Complete Firebase configuration
- [Migration Guide](MIGRATION_README.md) - Migration from Prisma to Firestore
- [API Documentation](docs/api.md) - API endpoint documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Firebase Setup Guide](firebase-setup.md)
2. Review the [Migration Guide](MIGRATION_README.md)
3. Check the browser console for errors
4. Verify your Firebase configuration
5. Ensure all environment variables are set correctly

## 🎯 Roadmap

- [ ] Offline support with Firestore offline persistence
- [ ] Real-time collaboration features
- [ ] Advanced analytics and insights
- [ ] Mobile app (React Native)
- [ ] Integration with learning platforms
- [ ] Career coaching marketplace
