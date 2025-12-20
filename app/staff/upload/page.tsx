'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadImage } from '@/lib/storage-service';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Upload } from '@/lib/types';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StaffUploadPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const [status, setStatus] = useState<string>('');

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... (existing logic)
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selected);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (existing logic)
        e.preventDefault();
        if (!file || !user) return;

        setUploading(true);
        setStatus('Uploading image...');
        try {
            const { downloadUrl, storagePath } = await uploadImage(file, user.uid);

            setStatus('Finalizing...');
            const uploadDoc: Omit<Upload, 'id'> = {
                date,
                imageUrl: downloadUrl,
                storagePath,
                status: 'PENDING',
                createdBy: user.uid,
                createdAt: Date.now()
            };

            await addDoc(collection(db, "uploads"), uploadDoc);
            toast.success("Sales sheet uploaded successfully for review!");

            // Reset form
            setFile(null);
            setPreview(null);
        } catch (error: any) {
            console.error(error);
            toast.error("Error submitting: " + error.message);
        } finally {
            setUploading(false);
            setStatus('');
        }
    };

    return (
        <div className="flex flex-col items-center p-4 max-w-lg mx-auto min-h-screen justify-center">
            <div className="w-full flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Staff Session</span>
                    <span className="text-sm font-medium text-white">{user?.displayName || user?.email?.split('@')[0]}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400">Sign Out</Button>
            </div>
            <Card className="w-full border-border/60">
                <CardHeader>
                    <CardTitle>Daily Sales Upload</CardTitle>
                    <CardDescription>Upload a photo of today's sales sheet.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="date">Business Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="bg-zinc-900 border-border/40"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Capture Sales Sheet</Label>
                            <div className="flex flex-col gap-4">
                                <input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-48 border-dashed border-border/40 flex flex-col gap-3 bg-muted/5 group hover:border-primary/50 transition-all"
                                    onClick={() => document.getElementById('image')?.click()}
                                >
                                    {preview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={preview} alt="Preview" className="h-full object-contain rounded-md" />
                                    ) : (
                                        <>
                                            <div className="p-4 bg-muted/20 rounded-full group-hover:bg-primary/10 transition-colors">
                                                <Camera className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">Tap to take photo</span>
                                                <span className="text-[10px] text-muted-foreground">Ensure text is clear and readable</span>
                                            </div>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 font-bold" disabled={!file || uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {status || 'Uploading...'}
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="mr-2 h-5 w-5" />
                                    Submit for Approval
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
