'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { auth } from "@/firebaseConfig"
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useTheme } from "@/components/theme-provider"
import { 
  Bell, 
  Clock, 
  Mail, 
  Calendar, 
  Monitor, 
  Globe, 
  Loader2, 
  AlertCircle,
  Save,
  ArrowLeft,
  CreditCard
} from 'lucide-react'
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

interface UserSettings {
  id: string;
  email: string;
  preferences: {
    emailNotifications: boolean;
    taskReminders: boolean;
    weeklyProgress: boolean;
    theme: 'light' | 'dark' | 'system';
    timeZone: string;
  };
}

interface Subscription {
  status: string;
  plan: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Move defaultPreferences outside the component to avoid recreating it on every render
const defaultPreferences = {
  emailNotifications: false,
  taskReminders: false,
  weeklyProgress: false,
  theme: 'system' as const,
  timeZone: 'UTC'
} as const;

export default function SettingsPage() {
  const { setTheme } = useTheme()
  
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  // Fetch user settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        const response = await axios.get(`${API_BASE_URL}/api/users/${currentUser.uid}`);
        
        const userData = {
          ...response.data,
          preferences: {
            ...defaultPreferences,
            ...response.data.preferences
          }
        };
        
        setSettings(userData);
        
        if (userData.preferences?.theme) {
          setTheme(userData.preferences.theme);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router, setTheme, defaultPreferences]);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        console.log('Fetching subscription for user:', currentUser.uid);
        
        const response = await axios.get(`${API_BASE_URL}/api/subscription/${currentUser.uid}`);
        console.log('Subscription response:', response.data);
        
        if (response.data) {
          setSubscription(response.data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // Don't show error toast for subscription - it might not exist
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleToggleChange = (field: string) => {
    if (!settings?.preferences) return
    setSettings(prev => prev ? {
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: !prev.preferences[field as keyof typeof prev.preferences]
      }
    } : null)
  }

  const handleThemeChange = (theme: string) => {
    if (!settings?.preferences) return
    setSettings(prev => prev ? {
      ...prev,
      preferences: {
        ...prev.preferences,
        theme: theme as 'light' | 'dark' | 'system'
      }
    } : null)
    setTheme(theme as 'light' | 'dark' | 'system')
  }

  const handleTimeZoneChange = (timezone: string) => {
    if (!settings?.preferences) return
    setSettings(prev => prev ? {
      ...prev,
      preferences: {
        ...prev.preferences,
        timeZone: timezone
      }
    } : null)
  }

  const handleSave = async () => {
    try {
      if (!settings) return;
      
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      
      const response = await axios.put(`${API_BASE_URL}/api/users/${settings.id}/preferences`, {
        preferences: settings.preferences
      });

      if (response.status === 200) {
        setTheme(settings.preferences?.theme || 'system');
        toast.success('Settings saved successfully!', {
          description: 'Your preferences have been updated.'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings', {
        description: 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="text-lg font-medium">Error loading settings</p>
        </div>
      </div>
    );
  }

  const preferences = settings.preferences || defaultPreferences;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Customize your experience</p>
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
      
      <Card className="mb-6 hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about your career progress via email
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={() => handleToggleChange('emailNotifications')}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Task Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about upcoming tasks
              </p>
            </div>
            <Switch
              checked={preferences.taskReminders}
              onCheckedChange={() => handleToggleChange('taskReminders')}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Weekly Progress Report
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your progress
              </p>
            </div>
            <Switch
              checked={preferences.weeklyProgress}
              onCheckedChange={() => handleToggleChange('weeklyProgress')}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              Theme
            </Label>
            <Select 
              value={preferences.theme}
              onValueChange={handleThemeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Time Zone
            </Label>
            <Select 
              value={preferences.timeZone}
              onValueChange={handleTimeZoneChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          className="flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {!subscriptionLoading && subscription && (
        <Card className="mb-6 hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </div>
              <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">Current Plan</h3>
              <p className="text-2xl font-bold">{subscription.plan}</p>
              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Billing</h3>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <Button 
                variant="destructive" 
                asChild
                className="w-full"
              >
                <Link href="/settings/subscription/cancel">
                  Cancel Subscription
                </Link>
              </Button>
            )}
            <Button 
              variant="outline" 
              asChild
              className="w-full"
            >
              <Link href="https://billing.stripe.com/p/login/test_28o5kq8Cr8Qf8WkcMM" target="_blank">
                Manage Billing
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}