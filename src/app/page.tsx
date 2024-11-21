'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  DollarSign, 
  Code, 
  FileText,
  Loader2,
  RocketIcon
} from 'lucide-react'

export default function Home() {
  const router = useRouter();
  const auth = getAuth();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    resume: '',
    dreamJob: '',
    dreamCompany: '',
    dreamSalary: '',
    skills: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Please sign in first');
      router.push('/auth');
      return;
    }

    if (!formData.email || !formData.name || !formData.resume || !formData.dreamJob || !formData.dreamCompany || !formData.dreamSalary) {
      alert('Please fill in all fields before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

      // Prepare the user data
      const userData = {
        id: currentUser.uid,
        email: formData.email,
        name: formData.name,
        bio: formData.resume,
        dreamJob: formData.dreamJob,
        dreamCompany: formData.dreamCompany,
        dreamSalary: formData.dreamSalary,
        skills: formData.skills.split(',')
          .map(skill => skill.trim())
          .filter(skill => skill !== '')
      };

      console.log('Attempting to save user data:', userData);

      // Create user
      const response = await axios.post(
        `${API_BASE_URL}/api/users`, 
        userData,
        { 
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('User creation response:', response.data);

      console.log('All data saved successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Full error object:', error);
      alert('Failed to save data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Tech Dream Job
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Start your journey towards your dream tech career. Fill in your profile and let us help you achieve your goals.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RocketIcon className="h-6 w-6 text-primary" />
            Your Dream Tech Job Profile
          </CardTitle>
          <CardDescription>
            Fill in your details to get started on your journey to your dream tech job.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </label>
                <Input 
                  id="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Enter your email"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Name
                </label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Enter your name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="skills" className="text-sm font-medium flex items-center gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  Skills
                </label>
                <Input 
                  id="skills" 
                  value={formData.skills} 
                  onChange={handleChange} 
                  placeholder="e.g., React, Node.js, Python (comma separated)"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="resume" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Professional Summary
                </label>
                <Textarea 
                  id="resume" 
                  value={formData.resume} 
                  onChange={handleChange} 
                  placeholder="Tell us about your experience, certifications, education, and current status"
                  className="min-h-[150px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dreamJob" className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Dream Tech Job
                </label>
                <Input 
                  id="dreamJob" 
                  value={formData.dreamJob} 
                  onChange={handleChange} 
                  placeholder="e.g., Senior Software Engineer"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dreamCompany" className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Dream Company
                </label>
                <Input 
                  id="dreamCompany" 
                  value={formData.dreamCompany} 
                  onChange={handleChange} 
                  placeholder="e.g., Google, Amazon, or startup"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="dreamSalary" className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Dream Salary
                </label>
                <Input 
                  id="dreamSalary" 
                  value={formData.dreamSalary} 
                  onChange={handleChange} 
                  placeholder="e.g., $150,000"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
                />
              </div>
            </div>

            <CardFooter className="px-0 pt-6">
              <Button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Your Profile...
                  </>
                ) : (
                  <>
                    <RocketIcon className="h-4 w-4" />
                    Launch Your Career Journey
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}