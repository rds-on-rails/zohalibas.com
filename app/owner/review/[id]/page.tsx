'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Upload, Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, ArrowLeft, Camera } from 'lucide-react';
import { toast } from 'sonner';

import { useParams } from 'next/navigation';

import { extractSalesData } from '@/lib/ai-service';

export default function ReviewPage() {
    const params = useParams();
    const id = params?.id as string;
    const { user, role, loading: authLoading } = useAuth();
    const router = useRouter();
    const [upload, setUpload] = useState<Upload | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Form State
    const [cash, setCash] = useState<number>(0);
    const [online, setOnline] = useState<number>(0);
    const [expenses, setExpenses] = useState<number>(0);

    const net = cash + online - expenses;

    useEffect(() => {
        const fetchUpload = async () => {
            try {
                const docRef = doc(db, "uploads", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as Omit<Upload, 'id'>;
                    setUpload({ id: docSnap.id, ...data });

                    // Pre-fill form with AI extracted data if available
                    if (data.extractedData) {
                        setCash(data.extractedData.cash || 0);
                        setOnline(data.extractedData.online || 0);
                        setExpenses(data.extractedData.expenses || 0);
                    }
                } else {
                    toast.error("Upload not found");
                    router.push('/owner/dashboard');
                }
            } catch (error) {
                console.error(error);
                toast.error("Error fetching upload");
            } finally {
                setLoading(false);
            }
        };

        fetchUpload();
    }, [id, router]);

    const handleRunAi = async () => {
        if (!upload || !user) return;
        setAnalyzing(true);
        try {
            toast.info("Starting AI Analysis...");
            const data = await extractSalesData(upload.imageUrl, user.uid);

            if (data.documentType === 'INVALID') {
                toast.error("AI couldn't find a valid sales sheet in this image.");
                return;
            }

            // Update UI
            setCash(data.cash || 0);
            setOnline(data.online || 0);
            setExpenses(data.expenses || 0);

            // Update local object and Firestore
            const updatedUpload = { ...upload, extractedData: data };
            setUpload(updatedUpload);

            await updateDoc(doc(db, "uploads", upload.id), {
                extractedData: data
            });

            toast.success("AI Analysis Complete!");
        } catch (error: any) {
            console.error(error);
            toast.error("AI analysis failed: " + error.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleApprove = async () => {
        if (!upload || !user) return;
        setProcessing(true);
        try {
            // 1. Create Sale Record
            const saleData: Omit<Sale, 'id'> = {
                date: upload.date,
                cash,
                online,
                expenses,
                net,
                sourceUploadId: upload.id,
                approvedBy: user.uid,
                approvedAt: Date.now()
            };

            await addDoc(collection(db, "sales"), saleData);

            // 2. Update Upload Status
            await updateDoc(doc(db, "uploads", upload.id), {
                status: 'APPROVED',
                reviewedBy: user.uid,
                reviewedAt: Date.now()
            });

            toast.success("Sales approved and saved!");
            router.push('/owner/dashboard');
        } catch (error: any) {
            console.error(error);
            toast.error("Approval failed: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!upload || !user) return;
        if (!confirm("Are you sure you want to reject this upload? It will not be included in reports.")) return;

        setProcessing(true);
        try {
            await updateDoc(doc(db, "uploads", upload.id), {
                status: 'REJECTED',
                reviewedBy: user.uid,
                reviewedAt: Date.now()
            });
            toast.success("Upload rejected.");
            router.push('/owner/dashboard');
        } catch (error: any) {
            toast.error("Rejection failed: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!upload) return null;

    return (
        <div className="container mx-auto p-4 max-w-7xl h-screen flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="ml-4">
                        <h1 className="text-2xl font-bold">Review Upload</h1>
                        <p className="text-sm text-muted-foreground">Original Date: {upload.date} | Sheet Date: <span className="text-primary font-medium">{upload.extractedData?.dateOnSheet || 'Not analyzed'}</span></p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!upload.extractedData && (
                        <Button
                            variant="secondary"
                            onClick={handleRunAi}
                            disabled={analyzing}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                            Run AI Analysis
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleReject}
                        disabled={processing || analyzing}
                    >
                        <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleApprove}
                        disabled={processing || analyzing}
                    >
                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Approve & Save
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
                {/* Left: Image Viewer */}
                <Card className="h-full flex flex-col overflow-hidden bg-black/50 border-border/50">
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-900 rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={upload.imageUrl}
                            alt="Sales Sheet"
                            className="max-w-full h-auto object-contain hover:scale-150 transition-transform duration-300 cursor-zoom-in"
                        />
                    </div>
                </Card>

                {/* Right: Detailed Breakdown & Form */}
                <div className="flex flex-col gap-6 overflow-auto pr-2">
                    {/* Summary Totals */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-lg">Summary Totals</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 py-0 pb-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Cash</Label>
                                <Input
                                    type="number"
                                    value={cash}
                                    onChange={(e) => setCash(Number(e.target.value))}
                                    className="font-mono h-8"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Online</Label>
                                <Input
                                    type="number"
                                    value={online}
                                    onChange={(e) => setOnline(Number(e.target.value))}
                                    className="font-mono h-8"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Expenses</Label>
                                <Input
                                    type="number"
                                    value={expenses}
                                    onChange={(e) => setExpenses(Number(e.target.value))}
                                    className="font-mono h-8 text-red-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Net Total</Label>
                                <div className="font-bold text-lg font-mono text-green-500 mt-1">₹{net.toLocaleString('en-IN')}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* All Extracted Records */}
                    <Card className="flex-1 min-h-[300px] flex flex-col overflow-hidden">
                        <CardHeader className="py-4 border-b">
                            <CardTitle className="text-lg">Extracted Records (OCR)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto flex-1">
                            {analyzing ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p>AI is processing the image...</p>
                                </div>
                            ) : !upload.extractedData ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-muted-foreground text-center">
                                    <div className="bg-muted p-4 rounded-full">
                                        <Camera className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-foreground">Pending AI Analysis</p>
                                        <p className="text-xs max-w-[250px]">Click "Run AI Analysis" to extract numbers automatically.</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={handleRunAi}>Start Extraction</Button>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr className="border-b">
                                            <th className="p-2 text-left font-medium text-muted-foreground">Classification</th>
                                            <th className="p-2 text-left font-medium text-muted-foreground">Content</th>
                                            <th className="p-2 text-right font-medium text-muted-foreground">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upload.extractedData?.rawLines?.map((line, idx) => (
                                            <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="p-2">
                                                    <span className={`px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-bold ${line.classification.includes('SALE') ? 'bg-green-500/10 text-green-500' :
                                                        line.classification === 'EXPENSE' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-muted text-muted-foreground'
                                                        }`}>
                                                        {line.classification.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-2 font-medium truncate max-w-[150px]">{line.content}</td>
                                                <td className="p-2 text-right font-mono">
                                                    {line.amount ? `₹${line.amount.toLocaleString('en-IN')}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!upload.extractedData?.rawLines || upload.extractedData.rawLines.length === 0) && (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-muted-foreground italic">
                                                    No individual records extracted.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Miscellaneous Notes */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-lg">AI Commentary & Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap min-h-[60px] border">
                                {analyzing ? 'Analysis in progress...' : upload.extractedData?.notes || 'No miscellaneous text or notes detected.'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
