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
        <div className="flex flex-col items-center p-6 max-w-lg mx-auto min-h-[calc(100-8rem)]">
            <Card className="w-full border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-8">
                    <CardTitle className="text-2xl font-serif font-bold text-[#7C0000]">Daily Sales Upload</CardTitle>
                    <CardDescription className="text-gray-500">Capture and upload a clear photo of today's sales sheet for approval.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-8 pt-8">
                        <div className="space-y-3">
                            <Label htmlFor="date" className="text-sm font-bold uppercase tracking-wider text-gray-700">Business Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="bg-white border-gray-200 h-12 text-lg rounded-xl focus:ring-[#7C0000] focus:border-[#7C0000]"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-wider text-gray-700">Capture Sales Sheet</Label>
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
                                    className="h-64 border-2 border-dashed border-gray-200 flex flex-col gap-4 bg-gray-50/30 group hover:border-[#7C0000]/50 hover:bg-[#7C0000]/5 transition-all rounded-2xl"
                                    onClick={() => document.getElementById('image')?.click()}
                                >
                                    {preview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <div className="relative w-full h-full p-2">
                                            <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl shadow-md" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                <span className="text-white font-bold">Change Photo</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-6 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                <Camera className="h-12 w-12 text-[#B5A280] group-hover:text-[#7C0000] transition-colors" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-lg font-serif font-bold text-gray-900">Tap to take photo</span>
                                                <span className="text-sm text-gray-500">Ensure text is clear and readable</span>
                                            </div>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8">
                        <Button type="submit" className="w-full h-14 bg-[#7C0000] hover:bg-[#5a0000] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#7C0000]/20 transition-all active:scale-[0.98]" disabled={!file || uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    {status || 'Uploading...'}
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="mr-3 h-6 w-6" />
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
