'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Bell, CheckCircle, AlertCircle, Trash2, MailOpen, ArrowLeft, Loader2 } from 'lucide-react'
import { auth } from '../../firebaseConfig'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

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

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
        const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
          params: { userId: currentUser.uid }
        })
        setNotifications(response.data)
      } catch (err) {
        console.error('Error fetching notifications:', err)
        setError('Failed to load notifications.')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [router])

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (notification.stepId) {
        console.log('Clicking notification for step:', notification.stepId);
        
        // Mark as read before navigating
        if (!notification.read) {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
          await axios.post(
            `${API_BASE_URL}/api/notifications/${notification.id}/read`,
            {},
            { withCredentials: true }
          );
          
          // Update local state
          setNotifications(notifications.map(notif => 
            notif.id === notification.id ? { ...notif, read: true } : notif
          ));
        }
        
        // Navigate to the step
        router.push(`/steps/${notification.stepId}`);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
      await axios.post(`${API_BASE_URL}/api/notifications/${id}/read`, {}, 
        { withCredentials: true }
      )
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
      await axios.delete(`${API_BASE_URL}/api/notifications/${id}`, 
        { withCredentials: true }
      )
      setNotifications(notifications.filter(notif => notif.id !== id))
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Bell className="h-5 w-5 text-blue-500" />;
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
            <ul className="space-y-4">
              {notifications.map((notif) => (
                <li 
                  key={notif.id} 
                  onClick={() => notif.stepId && handleNotificationClick(notif)}
                  className={`
                    relative group rounded-lg border
                    ${notif.read ? 'bg-muted/50' : 'bg-card'}
                    ${notif.stepId ? 'cursor-pointer hover:shadow-md' : ''}
                    transition-all duration-200
                  `}
                >
                  <div className="p-4 flex items-start gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      {getNotificationIcon(notif.type)}
                    </div>
                    
                    <div className="flex-grow space-y-1">
                      <p className={`${notif.read ? 'text-muted-foreground' : 'font-medium'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <time dateTime={notif.date}>
                          {new Date(notif.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                        {notif.stepId && (
                          <Badge variant="outline" className="ml-2">
                            View Step Details
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notif.read && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="hover:bg-primary/10"
                        >
                          <MailOpen className="h-4 w-4 mr-2" />
                          Mark Read
                        </Button>
                      )}
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}