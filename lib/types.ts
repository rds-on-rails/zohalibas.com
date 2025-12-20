export type Role = 'STAFF' | 'OWNER';
export type UploadStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
    uid: string;
    email: string | null;
    role: Role;
    createdAt: number;
}

export type DocumentType = 'SALES_SHEET' | 'INVALID' | 'DUPLICATE';

export interface ExtractedLine {
    content: string;
    classification: 'CASH_SALE' | 'ONLINE_SALE' | 'EXPENSE' | 'TOTAL_WRITTEN' | 'UNRELATED_TEXT' | 'UNKNOWN';
    amount: number | null;
}

export interface ExtractedData {
    documentType: DocumentType;
    cash: number;
    online: number;
    expenses: number;
    total: number;
    isDuplicate: boolean;
    duplicateOfId?: string;
    fingerprint?: string;
    rawLines?: ExtractedLine[];
    confidence?: number;
    riskFlags?: string[];
    dateOnSheet?: string | null;
    notes?: string | null;
}

export interface OcrLog {
    id?: string;
    imageUrl: string;
    fingerprint: string;
    rawResponse: any;
    extractedData: ExtractedData;
    error?: string;
    userId: string;
    createdAt: number;
    durationMs: number;
}

export interface Upload {
    id: string; // Firestore Link
    date: string; // YYYY-MM-DD
    imageUrl: string;
    storagePath: string; // For deletion references
    extractedData?: ExtractedData | null;
    status: UploadStatus;
    createdBy: string; // User UID
    createdAt: number; // Timestamp
    reviewedBy?: string;
    reviewedAt?: number;
}

export interface Sale {
    id: string;
    date: string; // YYYY-MM-DD, acting as the primary key logical grouping
    cash: number;
    online: number;
    expenses: number;
    net: number; // Calculated: cash + online - expenses
    sourceUploadId: string;
    approvedBy: string;
    approvedAt: number;
}
