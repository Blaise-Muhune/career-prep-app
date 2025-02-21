'use client';

import { usePathname } from 'next/navigation';
import NavBar from "@/components/nav-bar";

export default function LayoutWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const showNav = pathname !== '/auth' && pathname !== '/';

  return (
    <>
      {showNav && <NavBar />}
      <main className={showNav ? "pt-0 md:pt-16 pb-20 md:pb-6" : ""}>
        {children}
      </main>
    </>
  );
} 