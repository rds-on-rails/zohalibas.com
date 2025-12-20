'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (role === 'STAFF') {
        router.push('/staff/upload');
      } else if (role === 'OWNER') {
        router.push('/owner/dashboard');
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Loading Verve...</p>
      </div>
    </div>
  );
}
