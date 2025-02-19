'use client';

import { useEffect } from 'react';
import { useTheme } from "@/components/theme-provider"

interface ClientThemeWrapperProps {
  children: React.ReactNode;
}

export default function ClientThemeWrapper({ children }: ClientThemeWrapperProps) {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Load theme from localStorage on initial mount
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
  }, [setTheme]);

  return <>{children}</>;
} 