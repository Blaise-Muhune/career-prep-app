'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
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

export default function Home() {
  const router = useRouter();
  const auth = getAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Please sign in first');
      router.push('/auth');
      return;
    }

    if (!formData.dreamJob || !formData.dreamCompany || !formData.dreamSalary || !formData.bio || !formData.skills.length) {
      alert('Please fill in all fields before submitting.');
      setIsSubmitting(false);
      return;
    }
    
    try {

      // Prepare the user data
      const userData = {
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName,
        bio: formData.bio,
        dreamJob: formData.dreamJob,
        dreamCompany: formData.dreamCompany,
        dreamSalary: formData.dreamSalary,
        skills: formData.skills,
        technicalBackground: formData.technicalBackground,
        domainExperience: formData.domainExperience,
        futureGoals: formData.futureGoals,
        networkingPreferences: formData.networkingPreferences,
        learningStyle: formData.learningStyle,
        timeCommitment: formData.timeCommitment,
        preferredResources: formData.preferredResources
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

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-black">
      {/* Hero Section */}
      <div className="py-24 text-center space-y-8">
        <h1 className="text-6xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Tech Dream Job
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light">
          Craft your path in technology with precision and purpose.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <Card className="bg-white/70 dark:bg-black/70 backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-2xl font-medium text-gray-900 dark:text-white">
              Professional Profile
            </CardTitle>
            <CardDescription className="text-base text-gray-500 dark:text-gray-400 mt-2">
              Define your career aspirations with clarity and purpose.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Current Status Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentRole">Current Role</Label>
                    <Input
                      id="currentRole"
                      value={formData.currentRole}
                      onChange={handleChange}
                      placeholder="e.g., Junior Developer"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
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

              {/* Career Aspirations Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Career Aspirations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dreamJob">Dream Position</Label>
                    <Input
                      id="dreamJob"
                      value={formData.dreamJob}
                      onChange={handleChange}
                      className="h-12"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dreamCompany">Dream Company</Label>
                    <Input
                      id="dreamCompany"
                      value={formData.dreamCompany}
                      onChange={handleChange}
                      className="h-12"
                      placeholder="e.g., Google, Amazon, or startup"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="jobDescription">Job Description</Label>
                    <Textarea
                      id="jobDescription"
                      value={formData.jobDescription}
                      onChange={handleChange}
                      className="min-h-[100px] resize-none"
                      placeholder="Paste a job description that matches your dream role. This helps us provide more targeted guidance."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dreamSalary">Target Salary Range</Label>
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

              {/* Background & Skills Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Background & Skills</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Summary</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="min-h-[100px] resize-none"
                      placeholder="Tell us about your experience, certifications, education, and current status"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Education Level</Label>
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
                    <Label>Technical Background</Label>
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
                    <Label>Skills</Label>
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

              {/* Preferences Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Career Preferences</h3>
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-lg font-medium hover:opacity-90 transition-all duration-200"
              >
                {isSubmitting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  'Create Professional Profile'
                )}
              </Button>
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