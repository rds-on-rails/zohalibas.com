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

function MetricField({ label, value, color, bg = "bg-white", border = "border-gray-100" }: { label: string, value: number, color: string, bg?: string, border?: string }) {
    return (
        <div className={`p-4 rounded-2xl border ${border} ${bg} shadow-sm flex flex-col gap-1`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#B5A280]">{label}</span>
            <span className={`text-xl font-mono font-bold ${color}`}>₹{value.toLocaleString()}</span>
        </div>
    );
}

function SummaryBlock({ label, amount, isRed = false, isHighlight = false }: { label: string, amount: number, isRed?: boolean, isHighlight?: boolean }) {
    return (
        <div className={`p-4 rounded-xl border ${isHighlight ? 'bg-[#7C0000]/5 border-[#7C0000]/20' : 'bg-gray-50 border-gray-100'}`}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">{label}</div>
            <div className={`text-xl font-bold font-mono ${isRed ? 'text-red-600' : isHighlight ? 'text-[#7C0000]' : 'text-gray-900'}`}>
                ₹{amount.toLocaleString()}
            </div>
        </div>
    );
}

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
    const [editableLines, setEditableLines] = useState<any[]>([]);

    const updateTotalsFromLines = (lines: any[]) => {
        const totals = lines.reduce((acc, line) => {
            const amount = Number(line.amount) || 0;
            if (line.classification === 'CASH_SALE') acc.cash += amount;
            if (line.classification === 'ONLINE_SALE') acc.online += amount;
            if (line.classification === 'EXPENSE') acc.expenses += amount;
            return acc;
        }, { cash: 0, online: 0, expenses: 0 });

        setCash(totals.cash);
        setOnline(totals.online);
        setExpenses(totals.expenses);
    };

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
            const lines = selectedUpload.extractedData.rawLines || [];
            setEditableLines(lines);

            if (lines.length > 0) {
                updateTotalsFromLines(lines);
            } else {
                setCash(selectedUpload.extractedData.cash || 0);
                setOnline(selectedUpload.extractedData.online || 0);
                setExpenses(selectedUpload.extractedData.expenses || 0);
            }
        } else {
            setCash(0);
            setOnline(0);
            setExpenses(0);
            setEditableLines([]);
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

    const handleEditLine = (index: number, field: string, value: any) => {
        const newLines = [...editableLines];
        newLines[index] = { ...newLines[index], [field]: value };
        setEditableLines(newLines);
        updateTotalsFromLines(newLines);
    };

    const handleDeleteLine = (index: number) => {
        const newLines = editableLines.filter((_, i) => i !== index);
        setEditableLines(newLines);
        updateTotalsFromLines(newLines);
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
        <div className="container mx-auto p-6 max-w-7xl min-h-screen relative overflow-hidden">
            <header className="mb-10">
                <h2 className="text-3xl font-serif font-bold text-[#7C0000]">Owner Dashboard</h2>
                <p className="text-gray-500">Oversee sales performance and verify new uploads.</p>
            </header>

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
                                                            <span className="font-medium text-gray-900">{new Date(upload.createdAt).toLocaleDateString()}</span>
                                                            <span className="text-[10px] text-gray-500">{new Date(upload.createdAt).toLocaleTimeString()}</span>
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

                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-bold text-[#7C0000] px-1">Transaction Breakdown</h3>
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                            <tr>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Cash</th>
                                                <th className="px-6 py-4 text-right">Online</th>
                                                <th className="px-6 py-4 text-right">Expenses</th>
                                                <th className="px-6 py-4 text-right">Net</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {dailySales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-100 lowercase">verified</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-700">₹{sale.cash.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-700">₹{sale.online.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-red-500">₹{sale.expenses.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 border-l border-gray-50">₹{sale.net.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {dailySales.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">No approved sales for this date.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {dailySales.length > 0 && (
                                            <tfoot className="bg-gray-50/80 font-black border-t-2 border-gray-100">
                                                <tr>
                                                    <td className="px-6 py-4 text-[#7C0000] uppercase tracking-wider text-xs">Daily Totals</td>
                                                    <td className="px-6 py-4 text-right font-mono text-[#7C0000]">₹{dailyTotal.cash.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-[#7C0000]">₹{dailyTotal.online.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-red-600">₹{dailyTotal.expenses.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-xl text-[#7C0000] border-l border-gray-100">₹{dailyTotal.net.toLocaleString()}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
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

                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-bold text-[#7C0000] px-1">Monthly Record History</h3>
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                            <tr>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-right">Cash</th>
                                                <th className="px-6 py-4 text-right">Online</th>
                                                <th className="px-6 py-4 text-right">Expenses</th>
                                                <th className="px-6 py-4 text-right font-bold">Net</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {monthlySales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-700">₹{sale.cash.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-700">₹{sale.online.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-red-500">₹{sale.expenses.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 border-l border-gray-50">₹{sale.net.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {monthlySales.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">No approved sales for this month.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {monthlySales.length > 0 && (
                                            <tfoot className="bg-gray-50/80 font-black border-t-2 border-gray-100">
                                                <tr>
                                                    <td className="px-6 py-4 text-[#7C0000] uppercase tracking-wider text-xs">Monthly Totals</td>
                                                    <td className="px-6 py-4 text-right font-mono text-[#7C0000]">₹{monthlyTotal.cash.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-[#7C0000]">₹{monthlyTotal.online.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-red-600">₹{monthlyTotal.expenses.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-xl text-[#7C0000] border-l border-gray-100">₹{monthlyTotal.net.toLocaleString()}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- SIDE REVIEW PANEL --- */}
            {selectedUpload && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[850px] bg-white border-l border-gray-200 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-out flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#7C0000]/10 rounded-xl shadow-sm"><FileText className="h-6 w-6 text-[#7C0000]" /></div>
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-gray-900">Review & Verify</h2>
                                <p className="text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">{selectedUpload.date} | ID: {selectedUpload.id.slice(0, 8)}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedUpload(null)} className="rounded-full hover:bg-red-50 hover:text-[#7C0000] transition-colors"><X className="h-6 w-6" /></Button>
                    </div>

                    <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                        {/* Image Side */}
                        <div className="bg-gray-100/50 p-6 border-r border-gray-100 flex flex-col gap-4 overflow-hidden">
                            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-[#B5A280]">Original Document</Label>
                            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-inner overflow-hidden relative group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={selectedUpload.imageUrl}
                                    alt="Sale Sheet"
                                    className="w-full h-full object-contain hover:scale-125 transition-transform duration-500 cursor-zoom-in"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-tighter cursor-zoom-in">Hover to Zoom</span>
                                </div>
                            </div>
                        </div>

                        {/* Data Side */}
                        <div className="flex flex-col h-full overflow-hidden bg-white">
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* AI Status or Results */}
                                {!selectedUpload.extractedData ? (
                                    <div className="bg-[#B5A280]/5 border-2 border-dashed border-[#B5A280]/20 p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-6">
                                        <div className="p-4 bg-white rounded-full shadow-md"><AlertCircle className="h-10 w-10 text-[#B5A280]" /></div>
                                        <div>
                                            <h3 className="font-serif font-bold text-[#7C0000] text-xl">Awaiting AI Analysis</h3>
                                            <p className="text-sm text-gray-500 mt-2 max-w-[200px] leading-relaxed italic">Run extraction to automatically fill values.</p>
                                        </div>
                                        <Button onClick={() => handleRunAi(selectedUpload)} disabled={analyzingId === selectedUpload.id} className="w-full h-12 bg-[#7C0000] hover:bg-[#5a0000] shadow-lg shadow-[#7C0000]/20">
                                            {analyzingId === selectedUpload.id ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <Camera className="h-5 w-5 mr-3" />}
                                            Start AI Extraction
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {/* Summarized View */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <MetricField label="Cash" value={cash} color="text-gray-900" />
                                            <MetricField label="Online" value={online} color="text-gray-900" />
                                            <MetricField label="Expenses" value={expenses} color="text-red-600" />
                                            <MetricField label="Net Savings" value={cash + online - expenses} color="text-green-700" bg="bg-green-50/50" border="border-green-100" />
                                        </div>

                                        {/* OCR Line Items - THE NEW EDITABLE TABLE */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end px-1">
                                                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-[#B5A280]">Itemized Breakdown</Label>
                                                <span className="text-[10px] font-medium text-gray-400 italic">Values automatically update summaries</span>
                                            </div>
                                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-gray-100/80 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                                                            <th className="px-4 py-3 text-left">Description</th>
                                                            <th className="px-4 py-3 text-right">Amount</th>
                                                            <th className="px-4 py-3 text-center">Type</th>
                                                            <th className="px-4 py-3 text-right"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {editableLines?.map((line, i) => (
                                                            <tr key={i} className="group hover:bg-white transition-colors">
                                                                <td className="p-2 pl-4">
                                                                    <input
                                                                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-[#7C0000]/20 rounded px-2 py-1 text-gray-700 hover:bg-white transition-all font-medium"
                                                                        value={line.content}
                                                                        onChange={(e) => handleEditLine(i, 'content', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="p-2 w-24">
                                                                    <div className="flex items-center gap-1 bg-white border border-transparent group-hover:border-gray-100 rounded px-2">
                                                                        <span className="text-gray-400 font-mono">₹</span>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full bg-transparent border-none focus:ring-0 p-1 text-right font-mono font-bold text-gray-800"
                                                                            value={line.amount || 0}
                                                                            onChange={(e) => handleEditLine(i, 'amount', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 w-28 text-center">
                                                                    <select
                                                                        className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-md border-none focus:ring-1 focus:ring-[#7C0000]/20 appearance-none cursor-pointer text-center ${line.classification === 'EXPENSE' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                                                                            }`}
                                                                        value={line.classification}
                                                                        onChange={(e) => handleEditLine(i, 'classification', e.target.value)}
                                                                    >
                                                                        <option value="CASH_SALE">Cash</option>
                                                                        <option value="ONLINE_SALE">Online</option>
                                                                        <option value="EXPENSE">Expense</option>
                                                                        <option value="UNKNOWN">Ignore</option>
                                                                    </select>
                                                                </td>
                                                                <td className="p-2 pr-4 text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                                        onClick={() => handleDeleteLine(i)}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {editableLines.length === 0 && (
                                                            <tr>
                                                                <td colSpan={4} className="py-8 text-center text-gray-400 italic bg-white">No items to display.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* AI Notes */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-[#B5A280]">AI Assistant Observations</Label>
                                            <div className="text-sm p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-500 leading-relaxed shadow-inner">
                                                {selectedUpload.extractedData.notes || "No unusual activity detected on this sheet. Values seem clean and consistent."}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-gray-50/80 border-t border-gray-100 flex gap-4 mt-auto">
                                <Button variant="outline" className="flex-1 h-12 border-2 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold transition-all rounded-xl" onClick={handleReject} disabled={processing}>Reject & Discard</Button>
                                <Button className="flex-[2] h-12 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 text-white font-black uppercase tracking-widest transition-all active:scale-[0.98] rounded-xl" onClick={handleApprove} disabled={processing || !selectedUpload.extractedData}>
                                    {processing ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <Check className="h-5 w-5 mr-3" />}
                                    Finalize & Save Sales
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

