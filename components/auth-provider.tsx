'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Role } from '@/lib/types';
import { toast } from 'sonner';

interface AuthContextType {
    user: User | null;
    role: Role | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        setRole(userDoc.data().role as Role);
                    } else {
                        // New user signup - determine role
                        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
                        const userEmail = currentUser.email?.toLowerCase() || '';

                        const assignedRole: Role = adminEmails.includes(userEmail) ? 'OWNER' : 'STAFF';

                        await setDoc(userDocRef, {
                            uid: currentUser.uid,
                            email: currentUser.email,
                            role: assignedRole,
                            createdAt: Date.now()
                        });
                        setRole(assignedRole);
                    }
                } catch (e) {
                    console.error("Error fetching user role", e);
                    setRole('STAFF');
                }
            } else {
                setRole(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error("Google Sign In Error", error);
            toast.error("Login failed: " + error.message);
            throw error;
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
