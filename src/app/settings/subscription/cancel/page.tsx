'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { auth } from "@/firebaseConfig";
import axios from 'axios';
import { toast } from 'sonner';

export default function CancelSubscription() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        toast.error('Please log in to cancel your subscription');
        router.push('/auth');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://career-prep-app.vercel.app';
      const response = await axios.post(`${API_BASE_URL}/api/cancel-subscription`, {
        userId: user.uid
      });

      console.log(response);

      toast.success('Subscription will be canceled at the end of the billing period');
      router.push('/settings/subscription');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Cancel Subscription</CardTitle>
              <CardDescription>
                We&apos;re sorry to see you go
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-medium">Before you cancel:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Your subscription will remain active until the end of your current billing period</li>
              <li>You&apos;ll lose access to premium features when your subscription ends</li>
              <li>You can reactivate your subscription at any time</li>
              <li>Your career data and progress will be preserved</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Canceling...' : 'Confirm Cancellation'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/settings/subscription')}
            className="w-full"
          >
            Keep My Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 