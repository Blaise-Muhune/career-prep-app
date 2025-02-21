'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { auth } from "@/firebaseConfig"
import { signOut } from "firebase/auth"
import axios from 'axios'
import { 
  RocketIcon, 
  UserIcon, 
  Settings, 
  Bell, 
  LogOut,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning';
  message: string;
  date: string;
  read: boolean;
}

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const response = await axios.get('/api/get-notifications', {
        params: { userId },
        withCredentials: true
      })
      
      const notifs = response.data
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n: Notification) => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [])

  // Initial auth and notifications setup
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        fetchNotifications(user.uid)
      }
    })

    return () => unsubscribe()
  }, [fetchNotifications])

  // Polling for notifications
  useEffect(() => {
    if (!user) return

    const pollInterval = setInterval(() => {
      fetchNotifications(user.uid)
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(pollInterval)
  }, [user, fetchNotifications])

  // Reset notification count when visiting notifications page
  useEffect(() => {
    if (pathname === '/notifications' && user) {
      setUnreadCount(0)
      // Update local state to mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }, [pathname, user])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  // Notification indicator styles
  const notificationIndicator = unreadCount > 0 ? (
    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
      {unreadCount}
    </span>
  ) : null

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-b border-border h-16 z-50">
      <div className="container mx-auto h-full flex items-center justify-between gap-4">
        {/* Left side - Logo/Brand and Primary Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo/Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
            <RocketIcon className="h-6 w-6 text-primary" />
            <span className="hidden md:inline">Tech Dream Job</span>
          </Link>

          {/* Primary Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/dashboard">
              <Button 
                variant={isActive('/dashboard') ? "secondary" : "ghost"} 
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            
            <Link href="/steps">
              <Button 
                variant={isActive('/steps') ? "secondary" : "ghost"} 
                className="flex items-center gap-2"
              >
                <RocketIcon className="h-4 w-4" />
                Career Steps
              </Button>
            </Link>
          </div>
        </div>

        {/* Right side - User Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Link href="/notifications">
            <Button 
              variant={isActive('/notifications') ? "secondary" : "ghost"} 
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {notificationIndicator}
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-1 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                  <AvatarFallback>
                    {user?.displayName?.split(' ').map((n: string) => n[0]).join('') || user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <span className="font-normal text-muted-foreground">Signed in as</span>
                <span className="font-medium truncate">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16">
        <div className="container h-full flex items-center justify-around">
          <Link href="/dashboard">
            <Button 
              variant={isActive('/dashboard') ? "secondary" : "ghost"} 
              size="icon"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link href="/steps">
            <Button 
              variant={isActive('/steps') ? "secondary" : "ghost"} 
              size="icon"
            >
              <RocketIcon className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link href="/notifications">
            <Button 
              variant={isActive('/notifications') ? "secondary" : "ghost"} 
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {notificationIndicator}
            </Button>
          </Link>
          
          <Link href="/profile">
            <Button 
              variant={isActive('/profile') ? "secondary" : "ghost"} 
              size="icon"
            >
              <UserIcon className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
} 