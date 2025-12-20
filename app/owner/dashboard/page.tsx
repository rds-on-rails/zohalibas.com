'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Upload, Sale } from '@/lib/types';
import { Loader2, ArrowRight, Camera, Check, X, FileText, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { extractSalesData } from '@/lib/ai-service';
import { toast } from 'sonner';

export default function OwnerDashboard() {
    const { user, role, loading, signOut } = useAuth();
    const router = useRouter();
    const [pendingUploads, setPendingUploads] = useState<Upload[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Filter States
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    // Side View Panel State
    const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Quick Edit Form State (for side panel)
    const [cash, setCash] = useState<number>(0);
    const [online, setOnline] = useState<number>(0);
    const [expenses, setExpenses] = useState<number>(0);

    // Subscribe to Collections
    useEffect(() => {
        const qUploads = query(
            collection(db, "uploads"),
            where("status", "==", "PENDING"),
            orderBy("createdAt", "desc")
        );

        const qSales = query(collection(db, "sales"), orderBy("date", "desc"));

        const unsubUploads = onSnapshot(qUploads, (snap) => {
            setPendingUploads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Upload)));
            setLoadingData(false);
        });

        const unsubSales = onSnapshot(qSales, (snap) => {
            setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
        });

        return () => {
            unsubUploads();
            unsubSales();
        };
    }, []);

    // Sync Edit Form when selection changes
    useEffect(() => {
        if (selectedUpload?.extractedData) {
            setCash(selectedUpload.extractedData.cash || 0);
            setOnline(selectedUpload.extractedData.online || 0);
            setExpenses(selectedUpload.extractedData.expenses || 0);
        } else {
            setCash(0);
            setOnline(0);
            setExpenses(0);
        }
    }, [selectedUpload]);

    const handleRunAi = async (upload: Upload) => {
        setAnalyzingId(upload.id);
        try {
            toast.info("AI Extraction starting...");
            const data = await extractSalesData(upload.imageUrl, user?.uid || 'anonymous');

            if (data.documentType === 'INVALID') {
                toast.error("AI couldn't find a valid sales sheet.");
                return;
            }

            await updateDoc(doc(db, "uploads", upload.id), {
                extractedData: data
            });

            toast.success("Extraction complete!");
            // Update selected upload if it's currently open
            if (selectedUpload?.id === upload.id) {
                setSelectedUpload({ ...upload, extractedData: data });
            }
        } catch (error: any) {
            console.error(error);
            toast.error("AI failed: " + error.message);
        } finally {
            setAnalyzingId(null);
        }
    };

    const handleApprove = async () => {
        if (!selectedUpload || !user) return;
        setProcessing(true);
        try {
            const saleData: Omit<Sale, 'id'> = {
                date: selectedUpload.date,
                cash,
                online,
                expenses,
                net: cash + online - expenses,
                sourceUploadId: selectedUpload.id,
                approvedBy: user.uid,
                approvedAt: Date.now()
            };

            await addDoc(collection(db, "sales"), saleData);
            await updateDoc(doc(db, "uploads", selectedUpload.id), {
                status: 'APPROVED',
                reviewedBy: user.uid,
                reviewedAt: Date.now()
            });

            toast.success("Approved successfully!");
            setSelectedUpload(null);
        } catch (error: any) {
            toast.error("Approval failed: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedUpload || !user) return;
        if (!confirm("Reject this upload?")) return;
        setProcessing(true);
        try {
            await updateDoc(doc(db, "uploads", selectedUpload.id), {
                status: 'REJECTED',
                reviewedBy: user.uid,
                reviewedAt: Date.now()
            });
            toast.success("Rejected.");
            setSelectedUpload(null);
        } catch (error: any) {
            toast.error("Rejection failed");
        } finally {
            setProcessing(false);
        }
    };

    // Reports Aggregation
    const dailySales = sales.filter(s => s.date === selectedDate);
    const dailyTotal = dailySales.reduce((acc, curr) => ({
        cash: acc.cash + curr.cash, online: acc.online + curr.online,
        expenses: acc.expenses + curr.expenses, net: acc.net + curr.net
    }), { cash: 0, online: 0, expenses: 0, net: 0 });

    const monthlySales = sales.filter(s => s.date.startsWith(selectedMonth));
    const monthlyTotal = monthlySales.reduce((acc, curr) => ({
        cash: acc.cash + curr.cash, online: acc.online + curr.online,
        expenses: acc.expenses + curr.expenses, net: acc.net + curr.net
    }), { cash: 0, online: 0, expenses: 0, net: 0 });

    return (
        <div className="container mx-auto p-4 max-w-6xl min-h-screen relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-medium text-white">{user?.email}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{role}</p>
                    </div>
                    <Button variant="outline" className="text-xs" onClick={async () => {
                        await signOut();
                        router.push('/');
                    }}>Sign Out</Button>
                </div>
            </div>

            <Tabs defaultValue="review" className="w-full space-y-6">
                <TabsList className="bg-muted/50 p-1 border">
                    <TabsTrigger value="review">Queue ({pendingUploads.length})</TabsTrigger>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>

                <TabsContent value="review">
                    <Card className="border-border/60 overflow-hidden">
                        <CardHeader className="bg-muted/20 pb-4">
                            <CardTitle className="text-lg">Review Queue</CardTitle>
                            <CardDescription>Click a row to verify and approve image contents.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingData ? (
                                <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                            ) : pendingUploads.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground italic">No pending sheets to review.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
                                            <tr>
                                                <th className="px-6 py-3">Uploaded Date</th>
                                                <th className="px-6 py-3">Sales Date</th>
                                                <th className="px-6 py-3">Total Sales</th>
                                                <th className="px-6 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {pendingUploads.map((upload) => (
                                                <tr key={upload.id}
                                                    className={`hover:bg-primary/5 cursor-pointer transition-colors ${selectedUpload?.id === upload.id ? 'bg-primary/10' : ''}`}
                                                    onClick={() => setSelectedUpload(upload)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-white">{new Date(upload.createdAt).toLocaleDateString()}</span>
                                                            <span className="text-[10px] text-muted-foreground">{new Date(upload.createdAt).toLocaleTimeString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            <span className={upload.extractedData ? "text-primary" : "text-amber-500/70"}>
                                                                {upload.extractedData?.dateOnSheet || 'Pending Analysis'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs">
                                                        {upload.extractedData ? <span className="text-green-500">₹{upload.extractedData.total.toLocaleString()}</span> : <span className="text-muted-foreground">---</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        {upload.extractedData ? (
                                                            <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={() => setSelectedUpload(upload)}>
                                                                Finalize <Check className="ml-2 h-3 w-3" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white"
                                                                onClick={() => handleRunAi(upload)}
                                                                disabled={analyzingId === upload.id}
                                                            >
                                                                {analyzingId === upload.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3 mr-1" />}
                                                                Analyze
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Daily Tab */}
                <TabsContent value="daily">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Daily Overview</CardTitle>
                            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40 h-8" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <SummaryBlock label="Cash" amount={dailyTotal.cash} />
                                <SummaryBlock label="Online" amount={dailyTotal.online} />
                                <SummaryBlock label="Expenses" amount={dailyTotal.expenses} isRed />
                                <SummaryBlock label="Net" amount={dailyTotal.net} isHighlight />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Monthly Tab */}
                <TabsContent value="monthly">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Monthly Report</CardTitle>
                            <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40 h-8" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <SummaryBlock label="Total Cash" amount={monthlyTotal.cash} />
                                <SummaryBlock label="Total Online" amount={monthlyTotal.online} />
                                <SummaryBlock label="Total Expenses" amount={monthlyTotal.expenses} isRed />
                                <SummaryBlock label="Total Net" amount={monthlyTotal.net} isHighlight />
                            </div>
                            {/* Table omitted for brevity, can be re-added if space exists */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- SIDE REVIEW PANEL --- */}
            {selectedUpload && (
                <div className="fixed inset-y-0 right-0 w-[800px] bg-zinc-950 border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col p-6 gap-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md"><FileText className="h-5 w-5 text-primary" /></div>
                            <div>
                                <h2 className="text-xl font-bold">Review & Verify</h2>
                                <p className="text-xs text-muted-foreground">{selectedUpload.date} | ID: {selectedUpload.id.slice(0, 8)}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedUpload(null)}><X className="h-5 w-5" /></Button>
                    </div>

                    <div className="flex-1 overflow-hidden grid grid-cols-2 gap-6">
                        {/* Image Side */}
                        <div className="bg-zinc-900 rounded-xl border border-border/40 overflow-hidden relative flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedUpload.imageUrl} alt="Sale Sheet" className="max-w-full h-auto object-contain hover:scale-150 transition-transform cursor-zoom-in" />
                        </div>

                        {/* Data Side */}
                        <div className="flex flex-col gap-6 overflow-y-auto pr-1">
                            {/* AI Status or Results */}
                            {!selectedUpload.extractedData ? (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-4">
                                    <AlertCircle className="h-10 w-10 text-amber-500" />
                                    <div>
                                        <h3 className="font-bold text-amber-500">Awaiting AI Analysis</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Run extraction to automatically fill values.</p>
                                    </div>
                                    <Button onClick={() => handleRunAi(selectedUpload)} disabled={analyzingId === selectedUpload.id} className="w-full bg-amber-600 hover:bg-amber-700">
                                        {analyzingId === selectedUpload.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                                        Start Extraction Now
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Summary Inputs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Cash</Label>
                                            <Input type="number" value={cash} onChange={(e) => setCash(Number(e.target.value))} className="h-8 font-mono bg-zinc-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Online</Label>
                                            <Input type="number" value={online} onChange={(e) => setOnline(Number(e.target.value))} className="h-8 font-mono bg-zinc-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Expenses</Label>
                                            <Input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} className="h-8 font-mono bg-zinc-900 text-red-400" />
                                        </div>
                                        <div className="space-y-2 flex flex-col justify-end">
                                            <div className="text-[10px] uppercase text-muted-foreground mb-1">Calculated Net</div>
                                            <div className="h-8 flex items-center px-3 rounded-md bg-green-500/10 text-green-500 font-bold font-mono border border-green-500/20">
                                                ₹{(cash + online - expenses).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* OCR Line Items */}
                                    <div className="border border-border/40 rounded-xl overflow-hidden bg-zinc-900/30">
                                        <div className="text-[10px] uppercase py-2 px-4 bg-zinc-900 border-b border-border/40 font-bold tracking-widest">OCR Line Breakdown</div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-[11px]">
                                                <tbody>
                                                    {selectedUpload.extractedData.rawLines?.map((line, i) => (
                                                        <tr key={i} className="border-b border-border/20 last:border-0">
                                                            <td className="p-2 truncate max-w-[120px] text-muted-foreground">{line.content}</td>
                                                            <td className="p-2 text-right font-mono">₹{line.amount?.toLocaleString() || '---'}</td>
                                                            <td className="p-2 text-right">
                                                                <span className={`px-1 rounded-[2px] text-[8px] font-bold ${line.classification === 'EXPENSE' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                                                                    }`}>{line.classification.replace('_', ' ')}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* AI Notes */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase text-muted-foreground">AI Intelligence Notes</Label>
                                        <div className="text-xs p-3 bg-zinc-900 rounded-lg border border-border/40 italic text-muted-foreground">
                                            {selectedUpload.extractedData.notes || "No unusual text detected on sheet."}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 border-t border-border/40 pt-4">
                        <Button variant="outline" className="flex-1" onClick={handleReject} disabled={processing}>Reject & Discard</Button>
                        <Button className="flex-[2] bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={processing || !selectedUpload.extractedData}>
                            {processing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Approve Sales Data
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryBlock({ label, amount, isRed = false, isHighlight = false }: { label: string, amount: number, isRed?: boolean, isHighlight?: boolean }) {
    return (
        <div className={`p-4 rounded-xl border ${isHighlight ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border/40'}`}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{label}</div>
            <div className={`text-xl font-bold font-mono ${isRed ? 'text-red-400' : isHighlight ? 'text-primary' : 'text-white'}`}>
                ₹{amount.toLocaleString()}
            </div>
        </div>
    );
}
