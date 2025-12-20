'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user || role !== 'OWNER') {
                router.push('/');
            }
        }
    }, [user, role, loading, router]);

    if (loading || !user || role !== 'OWNER') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
