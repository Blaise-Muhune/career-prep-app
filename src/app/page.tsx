'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface FormData {
  dreamJob: string;
  dreamCompany: string;
  dreamSalary: string;
  bio: string;
  jobDescription: string;
  skills: string[];
  technicalBackground: string;
  domainExperience: string;
  futureGoals: string[];
  networkingPreferences: string[];
  learningStyle: string[];
  timeCommitment: string;
  preferredResources: string[];
  currentRole: string;
  yearsOfExperience: string;
  educationLevel: string;
  certifications: string[];
  preferredWorkEnvironment: string[];
  careerMotivations: string[];
  industryPreferences: string[];
}

const TECHNICAL_BACKGROUNDS = [
  "No Technical Background",
  "Self-Taught",
  "Bootcamp Graduate",
  "Computer Science Student",
  "Computer Science Graduate",
  "Working Professional",
  "Senior Professional"
];

const DOMAIN_EXPERIENCES = [
  "No Industry Experience",
  "0-1 Years",
  "1-3 Years",
  "3-5 Years",
  "5-10 Years",
  "10+ Years"
];

const LEARNING_STYLES = [
  "Self-Paced Online Courses",
  "Structured Programs",
  "Project-Based Learning",
  "Peer Learning",
  "Mentorship-Based",
  "Academic Style",
  "Hands-On Workshops"
];

const TIME_COMMITMENTS = [
  "1-2 hours/week",
  "3-5 hours/week",
  "5-10 hours/week",
  "10-15 hours/week",
  "15+ hours/week",
  "Full-time"
];

const EDUCATION_LEVELS = [
  "High School",
  "Some College",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Self-Taught",
  "Bootcamp Graduate"
];

const WORK_ENVIRONMENTS = [
  "Remote",
  "Hybrid",
  "Office-based",
  "Startup",
  "Enterprise",
  "Consulting",
  "Agency",
  "Freelance"
];

const CAREER_MOTIVATIONS = [
  "Technical Excellence",
  "Leadership Opportunities",
  "Work-Life Balance",
  "Innovation",
  "Social Impact",
  "Financial Growth",
  "Job Security",
  "Learning & Development"
];

const INDUSTRY_PREFERENCES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "E-commerce",
  "Gaming",
  "Entertainment",
  "Cybersecurity",
  "AI/ML",
  "Blockchain",
  "IoT",
  "Clean Tech"
];

const FORM_SECTIONS = [
  {
    id: 'current-status',
    title: 'Current Status',
    description: 'Tell us about where you are now',
    required: false
  },
  {
    id: 'career-aspirations',
    title: 'Career Aspirations',
    description: 'What\'s your dream job?',
    required: true
  },
  {
    id: 'background-skills',
    title: 'Background & Skills',
    description: 'What can you bring to the table?',
    required: true
  },
  {
    id: 'preferences',
    title: 'Career Preferences',
    description: 'What matters most to you?',
    required: false
  }
];

export default function Home() {
  const router = useRouter();
  const auth = getAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // Check if this is an existing user (has signed in before)
        if (user.metadata.creationTime !== user.metadata.lastSignInTime) {
          console.log('Existing user detected - redirecting to dashboard');
          router.push('/dashboard');
          return;
        } else {
          console.log('New user - checking if profile already exists');
          try {
            // Additional check: verify if user profile already exists in database
            const response = await axios.get(`/api/get-user?id=${user.uid}`);
            if (response.data && response.data.exists) {
              console.log('User profile already exists - redirecting to dashboard');
              router.push('/dashboard');
              return;
            }
            console.log('No existing profile found - allowing access to profile creation');
            setIsLoading(false);
          } catch (error) {
            // If there's an error checking the database, assume user can proceed
            // This prevents blocking legitimate new users due to API errors
            console.log('Error checking user profile, allowing access:', error);
            setIsLoading(false);
          }
        }
      } else {
        console.log('No user - redirecting to auth');
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  }, [router, auth]);

  const [formData, setFormData] = useState<FormData>({
    dreamJob: '',
    dreamCompany: '',
    dreamSalary: '',
    bio: '',
    jobDescription: '',
    skills: [],
    technicalBackground: '',
    domainExperience: '',
    futureGoals: [],
    networkingPreferences: [],
    learningStyle: [],
    timeCommitment: '',
    preferredResources: [],
    currentRole: '',
    yearsOfExperience: '',
    educationLevel: '',
    certifications: [],
    preferredWorkEnvironment: [],
    careerMotivations: [],
    industryPreferences: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Checking your profile status...
        </p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleMultiSelect = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const isSectionComplete = (sectionId: string) => {
    switch (sectionId) {
      case 'current-status':
        return true; // Always complete as it's optional
      case 'career-aspirations':
        return formData.dreamJob && formData.dreamCompany && formData.dreamSalary;
      case 'background-skills':
        return formData.bio && formData.skills.length > 0;
      case 'preferences':
        return true; // Always complete as it's optional
      default:
        return false;
    }
  };

  const updateCompletedSections = () => {
    const newCompleted = new Set(completedSections);
    FORM_SECTIONS.forEach(section => {
      if (isSectionComplete(section.id)) {
        newCompleted.add(section.id);
      }
    });
    setCompletedSections(newCompleted);
  };

  const nextStep = () => {
    if (currentStep < FORM_SECTIONS.length - 1) {
      updateCompletedSections();
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const currentSection = FORM_SECTIONS[currentStep];
    if (currentSection.required) {
      return isSectionComplete(currentSection.id);
    }
    return true;
  };

  const getProgressPercentage = () => {
    return ((currentStep + 1) / FORM_SECTIONS.length) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Please sign in first');
      router.push('/auth');
      return;
    }

    // Only require essential fields
    if (!formData.dreamJob || !formData.dreamCompany || !formData.dreamSalary || !formData.bio || !formData.skills.length) {
      alert('Please fill in all required fields: Dream Position, Dream Company, Target Salary, Professional Summary, and at least one skill.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Prepare the user data with default text for empty optional fields
      const userData = {
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName,
        bio: formData.bio,
        dreamJob: formData.dreamJob,
        dreamCompany: formData.dreamCompany,
        dreamSalary: formData.dreamSalary,
        skills: formData.skills,
        jobDescription: formData.jobDescription || "User did not specify a job description",
        currentRole: formData.currentRole || "User did not specify current role",
        yearsOfExperience: formData.yearsOfExperience || "User did not specify years of experience",
        educationLevel: formData.educationLevel || "User did not specify education level",
        technicalBackground: formData.technicalBackground || "User did not specify technical background",
        domainExperience: formData.domainExperience || "User did not specify domain experience",
        futureGoals: formData.futureGoals.length > 0 ? formData.futureGoals : ["User did not specify future goals"],
        networkingPreferences: formData.networkingPreferences.length > 0 ? formData.networkingPreferences : ["User did not specify networking preferences"],
        learningStyle: formData.learningStyle.length > 0 ? formData.learningStyle : ["User did not specify learning style"],
        timeCommitment: formData.timeCommitment || "User did not specify time commitment",
        preferredResources: formData.preferredResources.length > 0 ? formData.preferredResources : ["User did not specify preferred resources"],
        industryPreferences: formData.industryPreferences.length > 0 ? formData.industryPreferences : ["User did not specify industry preferences"],
        preferredWorkEnvironment: formData.preferredWorkEnvironment.length > 0 ? formData.preferredWorkEnvironment : ["User did not specify work environment preferences"],
        careerMotivations: formData.careerMotivations.length > 0 ? formData.careerMotivations : ["User did not specify career motivations"]
      };

      console.log('Attempting to save user data:', userData);

      // Create user
      const response = await axios.post(
        `/api/create-user`, 
        userData,
        { 
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('User creation response:', response.data);

      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('All data saved successfully');
      toast.success('Profile created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Full error object:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStatusSection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Where are you now?</h3>
        <p className="text-gray-600 dark:text-gray-400">Let's start with your current situation</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="currentRole">Current Role (Optional)</Label>
          <Input 
            id="currentRole"
            value={formData.currentRole}
            onChange={handleChange} 
            placeholder="e.g., Junior Developer"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearsOfExperience">Years of Experience (Optional)</Label>
          <Select
            value={formData.yearsOfExperience}
            onValueChange={(value) => setFormData({ ...formData, yearsOfExperience: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {DOMAIN_EXPERIENCES.map((exp) => (
                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderCareerAspirationsSection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">What's your dream?</h3>
        <p className="text-gray-600 dark:text-gray-400">Tell us about your career goals</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="dreamJob">Dream Position *</Label>
          <Input 
            id="dreamJob" 
            value={formData.dreamJob} 
            onChange={handleChange} 
            className="h-12"
            placeholder="e.g., Senior Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dreamCompany">Dream Company *</Label>
          <Input 
            id="dreamCompany" 
            value={formData.dreamCompany} 
            onChange={handleChange} 
            className="h-12"
            placeholder="e.g., Google, Amazon, or startup"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="jobDescription">Job Description (Optional)</Label>
          <Textarea
            id="jobDescription"
            value={formData.jobDescription}
            onChange={handleChange}
            className="min-h-[100px] resize-none"
            placeholder="Paste a job description that matches your dream role. This helps us provide more targeted guidance."
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dreamSalary">Target Salary Range *</Label>
          <Select
            value={formData.dreamSalary}
            onValueChange={(value) => setFormData({ ...formData, dreamSalary: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select salary range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50-75k">$50,000 - $75,000</SelectItem>
              <SelectItem value="75-100k">$75,000 - $100,000</SelectItem>
              <SelectItem value="100-150k">$100,000 - $150,000</SelectItem>
              <SelectItem value="150-200k">$150,000 - $200,000</SelectItem>
              <SelectItem value="200k+">$200,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderBackgroundSkillsSection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">What can you bring?</h3>
        <p className="text-gray-600 dark:text-gray-400">Tell us about your background and skills</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bio">Professional Summary *</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={handleChange}
            className="min-h-[100px] resize-none"
            placeholder="Tell us about your experience, certifications, education, and current status"
          />
        </div>
        <div className="space-y-2">
          <Label>Education Level (Optional)</Label>
          <Select
            value={formData.educationLevel}
            onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select education level" />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Technical Background (Optional)</Label>
          <Select
            value={formData.technicalBackground}
            onValueChange={(value) => setFormData({ ...formData, technicalBackground: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select technical background" />
            </SelectTrigger>
            <SelectContent>
              {TECHNICAL_BACKGROUNDS.map((bg) => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Skills *</Label>
          <div className="flex gap-3">
            <Input 
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              placeholder="Add a skill"
              className="h-12"
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <Button
              type="button"
              onClick={handleAddSkill}
              className="px-6 h-12"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills.map((skill) => (
              <Badge
                key={skill}
                className="px-3 py-1 cursor-pointer hover:bg-primary/20"
                onClick={() => handleRemoveSkill(skill)}
              >
                {skill} ×
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">What matters to you?</h3>
        <p className="text-gray-600 dark:text-gray-400">Help us understand your preferences</p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Industry Preferences</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INDUSTRY_PREFERENCES.map((industry) => (
              <div
                key={industry}
                onClick={() => handleMultiSelect('industryPreferences', industry)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.industryPreferences.includes(industry)
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'hover:bg-accent'
                }`}
              >
                {industry}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Work Environment Preferences</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {WORK_ENVIRONMENTS.map((env) => (
              <div
                key={env}
                onClick={() => handleMultiSelect('preferredWorkEnvironment', env)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.preferredWorkEnvironment.includes(env)
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'hover:bg-accent'
                }`}
              >
                {env}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Career Motivations</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CAREER_MOTIVATIONS.map((motivation) => (
              <div
                key={motivation}
                onClick={() => handleMultiSelect('careerMotivations', motivation)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.careerMotivations.includes(motivation)
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'hover:bg-accent'
                }`}
              >
                {motivation}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Learning Style</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LEARNING_STYLES.map((style) => (
              <div
                key={style}
                onClick={() => handleMultiSelect('learningStyle', style)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.learningStyle.includes(style)
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'hover:bg-accent'
                }`}
              >
                {style}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Time Commitment</Label>
          <Select
            value={formData.timeCommitment}
            onValueChange={(value) => setFormData({ ...formData, timeCommitment: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select time commitment" />
            </SelectTrigger>
            <SelectContent>
              {TIME_COMMITMENTS.map((time) => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    const currentSection = FORM_SECTIONS[currentStep];
    
    switch (currentSection.id) {
      case 'current-status':
        return renderCurrentStatusSection();
      case 'career-aspirations':
        return renderCareerAspirationsSection();
      case 'background-skills':
        return renderBackgroundSkillsSection();
      case 'preferences':
        return renderPreferencesSection();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-black">
      {/* Hero Section */}
      <div className="py-16 text-center space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Tech Dream Job
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light">
          Let's build your career path together, step by step! 🚀
        </p>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="bg-white/70 dark:bg-black/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Step {currentStep + 1} of {FORM_SECTIONS.length}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(getProgressPercentage())}% Complete
            </span>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {FORM_SECTIONS.map((section, index) => (
              <div key={section.id} className="flex flex-col items-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  index < currentStep 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-primary border-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs text-center max-w-20 ${
                  index === currentStep 
                    ? 'text-primary font-medium' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {section.title}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <Card className="bg-white/70 dark:bg-black/70 backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-2xl font-medium text-gray-900 dark:text-white">
              {FORM_SECTIONS[currentStep].title}
            </CardTitle>
            <CardDescription className="text-base text-gray-500 dark:text-gray-400 mt-2">
              {FORM_SECTIONS[currentStep].description}
            </CardDescription>
            {FORM_SECTIONS[currentStep].required && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">*</span> Required fields
              </div>
            )}
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {renderCurrentSection()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-6 h-12"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < FORM_SECTIONS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="px-6 h-12"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !canProceed()}
                    className="px-8 h-12 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    Complete Profile
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Designed in California. Made for the future.
        </p>
      </footer>
    </div>
  );
}