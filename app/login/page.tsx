'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
    const { signInWithGoogle } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            toast.success("Logged in successfully");
            router.push('/'); // Root page will redirect based on role
        } catch (error: any) {
            // toast.error handled in provider
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center p-4 bg-gray-50/50">
            <Card className="w-full max-w-md border-gray-100 shadow-2xl shadow-gray-200/60 rounded-3xl overflow-hidden">
                <CardHeader className="text-center bg-white pb-8 pt-10">
                    <div className="mx-auto w-24 h-24 mb-6 transition-transform hover:scale-105">
                        <img
                            src="/logo.jpg"
                            alt="Zoha Libas"
                            className="w-full h-full rounded-full border-2 border-[#B5A280] shadow-xl object-cover"
                        />
                    </div>
                    <CardTitle className="text-3xl font-serif font-bold text-[#7C0000] uppercase tracking-wider">Welcome back</CardTitle>
                    <CardDescription className="text-gray-500 mt-2 italic">Sign in to manage the Zoha Libas legacy.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-10 px-8">
                    <Button
                        onClick={handleLogin}
                        className="w-full h-14 flex gap-4 text-lg font-bold border-2 border-gray-100 hover:border-[#7C0000]/20 hover:bg-[#7C0000]/5 transition-all rounded-2xl shadow-sm text-gray-700"
                        disabled={loading}
                        variant="outline"
                    >
                        {/* Simple Google G Icon */}
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        {loading ? "Establishing session..." : "Sign in with Google"}
                    </Button>
                </CardContent>
                <CardFooter className="bg-gray-50/50 py-6 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 text-center w-full uppercase tracking-[0.2em]">Authorized Access Only</p>
                </CardFooter>
            </Card>
        </div>
    );
}

