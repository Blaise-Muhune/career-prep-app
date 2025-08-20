'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/firebaseConfig"
import { useRouter } from 'next/navigation'
import { 
  User, 
  Briefcase, 
  Building2, 
  DollarSign, 
  Code, 
  FileText,
  Loader2,
  AlertCircle,
  Save,
  Pencil,
  ArrowLeft,
  Mail,
} from 'lucide-react'

interface Profile {
  bio: string;
  dreamJob: string;
  dreamCompany: string;
  dreamSalary: string;
  skills: Array<{ name: string }>;
}

interface User {
  id: string;
  email: string;
  name: string;
  profile: Profile;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        const response = await axios.get('/api/get-user', {
          params: { userId: currentUser.uid },
          withCredentials: true
        });
        
        // Ensure profile data exists, initialize with defaults if null
        const userData = response.data;
        if (userData && !userData.profile) {
          userData.profile = {
            bio: '',
            dreamJob: '',
            dreamCompany: '',
            dreamSalary: '',
            skills: []
          };
        }
        
        setUser(userData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!user) return;

    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setUser(prev => prev ? {
        ...prev,
        profile: {
          ...prev.profile || {
            bio: '',
            dreamJob: '',
            dreamCompany: '',
            dreamSalary: '',
            skills: []
          },
          [profileField]: value
        }
      } : null);
    } else {
      setUser(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push('/auth');
        return;
      }

      await axios.post('/api/create-user', {
        id: currentUser.uid,
        email: user.email,
        name: user.name,
        bio: user.profile?.bio || '',
        skills: (user.profile?.skills || []).map(s => s.name),
        dreamJob: user.profile?.dreamJob || '',
        dreamCompany: user.profile?.dreamCompany || '',
        dreamSalary: user.profile?.dreamSalary || ''
      }, {
        withCredentials: true
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="text-lg font-medium">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            {user.profile?.bio || user.profile?.dreamJob ? 
              'Manage your personal information' : 
              'Complete your profile to get personalized career recommendations'
            }
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20 ring-2 ring-primary/10">
              <AvatarImage src="/placeholder.svg" alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <Input
                      name="name"
                      value={user.name}
                      onChange={handleInputChange}
                      className="font-bold"
                    />
                  </div>
                ) : user.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
                    <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Bio
            </Label>
            {isEditing ? (
              <Textarea
                id="bio"
                name="profile.bio"
                value={user.profile?.bio || ''}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about yourself, your goals, and what drives you..."
                className="resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <div>
                {user.profile?.bio ? (
                  <p className="text-muted-foreground">{user.profile.bio}</p>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-muted-foreground">No bio added yet</p>
                    <p className="text-sm text-muted-foreground/60">Click edit to add your bio</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dreamJob" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Dream Job
              </Label>
              {isEditing ? (
                <Input
                  id="dreamJob"
                  name="profile.dreamJob"
                  value={user.profile?.dreamJob || ''}
                  onChange={handleInputChange}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-muted-foreground">{user.profile?.dreamJob || 'No dream job specified'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dreamCompany" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Dream Company
              </Label>
              {isEditing ? (
                <Input
                  id="dreamCompany"
                  name="profile.dreamCompany"
                  value={user.profile?.dreamCompany || ''}
                  onChange={handleInputChange}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-muted-foreground">{user.profile?.dreamCompany || 'No dream company specified'}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dreamSalary" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Dream Salary
            </Label>
            {isEditing ? (
              <Input
                id="dreamSalary"
                name="profile.dreamSalary"
                                  value={user.profile?.dreamSalary || ''}
                onChange={handleInputChange}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            ) : (
                              <p className="text-muted-foreground">{user.profile?.dreamSalary || 'No dream salary specified'}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              Skills
            </Label>
            <div className="flex flex-wrap gap-2">
              {user.profile?.skills && user.profile.skills.length > 0 ? (
                user.profile.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill.name}
                  </span>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No skills added yet</p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end pt-6">
          {isEditing ? (
            <Button 
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}