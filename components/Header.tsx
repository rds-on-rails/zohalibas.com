'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

export function Header() {
    const { user, role, signInWithGoogle, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            toast.success("Logged in successfully");
        } catch (error: any) {
            // Error handled in provider
        } finally {
            setLoading(false);
        }
    };

    return (
        <header className="w-full flex flex-col">
            {/* Top Tier */}
            <div className="container mx-auto w-full bg-white py-4 px-6 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-[#B5A280] shadow-md transition-transform hover:rotate-6">
                        <span className="text-[11px] text-white font-serif font-bold text-center leading-tight uppercase px-1">
                            Zoha<br />Libas
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#4a0404] tracking-tighter uppercase drop-shadow-sm">
                        Zoha Libas Center
                    </h1>
                </div>

                <div>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-500 hidden md:block italic">
                                Welcome, <span className="text-gray-800 font-bold">{user.displayName || user.email?.split('@')[0]}</span>
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => signOut()}
                                className="text-gray-600 hover:text-[#7C0000] hover:bg-[#7C0000]/5 font-bold uppercase text-xs tracking-widest transition-all"
                            >
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleLogin}
                            disabled={loading}
                            variant="outline"
                            className="flex gap-2 border-2 border-[#7C0000] text-[#7C0000] hover:bg-[#7C0000] hover:text-white transition-all font-bold px-6 h-11 rounded-lg"
                        >
                            {/* ... (SVG kept) */}
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                            {loading ? "Signing in..." : "Google Login"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Bottom Tier Nav */}
            <nav className="w-full bg-[#B5A280] py-4 shadow-lg border-y border-[#B5A280]/20">
                <ul className="container mx-auto flex justify-center flex-wrap gap-x-16 gap-y-3 text-[#5c0303] font-black text-lg uppercase tracking-[0.2em]">
                    <li>
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    </li>
                    <li>
                        <Link href="/collection" className="hover:text-white transition-colors">Collection</Link>
                    </li>
                    {user && (
                        <li>
                            <Link
                                href={role === 'OWNER' ? '/owner/dashboard' : '/staff/upload'}
                                className="bg-[#7C0000] text-white px-6 py-2 rounded-lg shadow-xl shadow-black/20 hover:scale-105 transition-all inline-block border border-[#7C0000]"
                            >
                                {role === 'OWNER' ? 'Owner Dashboard' : 'Staff Upload'}
                            </Link>
                        </li>
                    )}
                    <li>
                        <Link href="/about" className="hover:text-white transition-colors">About us</Link>
                    </li>
                    <li>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact us</Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
