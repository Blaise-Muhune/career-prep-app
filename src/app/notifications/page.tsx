'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Bell, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { auth } from '../../firebaseConfig'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Notification = {
  id: number
  type: 'info' | 'success' | 'warning'
  message: string
  date: string
  read: boolean
  stepId?: number
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push('/auth');
          return;
        }

        const response = await axios.get('/api/get-notifications', {
          params: { userId: currentUser.uid },
          withCredentials: true
        });

        if (Array.isArray(response.data)) {
          setNotifications(response.data);
          
          // Mark notifications as read when page is visited
          await markNotificationsAsRead(currentUser.uid);
        } else {
          console.warn('Notifications data is not an array:', response.data);
          setNotifications([]);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications.');
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [router]);

  const markNotificationsAsRead = async (userId: string) => {
    try {
      await axios.post('/api/mark-notifications-read', { userId });
      // Update local state to mark all notifications as read
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          read: true
        }))
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (notification.stepId) {
        router.push(`/steps/${notification.stepId}`);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay updated with your career journey</p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Your Updates</CardTitle>
          <Badge variant="secondary">
            {notifications.filter(n => !n.read).length} unread
          </Badge>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center p-8 text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No new notifications</p>
              <p className="text-sm">We&apos;ll notify you when there are updates</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={cn(
                    "transition-all duration-200 hover:shadow-md cursor-pointer",
                    !notification.read && "bg-accent/20"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                        </p>
                        <p className="mt-1">{notification.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}