import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import AuthGuard from "@/components/auth-guard";
import { Toaster } from "sonner"
import ClientThemeWrapper from "@/components/client-theme-wrapper";
import LayoutWrapper from "@/components/layout-wrapper";

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: "Career Prep App",
  description: "Your personalized career development assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>
          <ClientThemeWrapper>
            <div
              className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
            >
              <AuthGuard>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </AuthGuard>
            </div>
          </ClientThemeWrapper>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
