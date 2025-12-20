'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedData, ExtractedLine, OcrLog } from "@/lib/types";
import { adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                               Gemini Setup                                 */
/* -------------------------------------------------------------------------- */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/* -------------------------------------------------------------------------- */
/*                             Validation Schemas                             */
/* -------------------------------------------------------------------------- */

const GeminiOutputSchema = z.object({
    documentType: z.enum(["VALID", "INVALID"]),
    dateOnSheet: z.string().nullable(),
    cashTotal: z.number().nullable(),
    onlineTotal: z.number().nullable(),
    expenseTotal: z.number().nullable(),
    writtenTotal: z.number().nullable(),
    netTotal: z.number().nullable(),
    lineItems: z.array(z.object({
        classification: z.enum(["CASH_SALE", "ONLINE_SALE", "EXPENSE", "TOTAL_WRITTEN", "UNRELATED_TEXT", "UNKNOWN"]),
        content: z.string(),
        amount: z.number().nullable()
    })),
    miscellaneousNotes: z.string().nullable(),
    confidenceScore: z.number(),
    riskFlags: z.array(z.string())
});

/* -------------------------------------------------------------------------- */
/*                           Utility: Image Hashing                            */
/* -------------------------------------------------------------------------- */

/**
 * Generates a SHA-256 fingerprint for duplicate detection.
 */
function generateFingerprint(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

/* -------------------------------------------------------------------------- */
/*                      Utility: Audit & Duplicate Checks                      */
/* -------------------------------------------------------------------------- */

async function logOcrAttempt(log: OcrLog) {
    try {
        await adminDb.collection("ocr_logs").add(log);
    } catch (err) {
        console.error("Failed to log OCR attempt:", err);
    }
}

async function checkDuplicate(
    fingerprint: string
): Promise<{ isDuplicate: boolean; duplicateOfId?: string }> {
    try {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        const snapshot = await adminDb.collection("uploads")
            .where("extractedData.fingerprint", "==", fingerprint)
            .where("createdAt", ">", thirtyDaysAgo)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            return {
                isDuplicate: true,
                duplicateOfId: snapshot.docs[0].id,
            };
        }

        return { isDuplicate: false };
    } catch (err) {
        console.error("Duplicate check failed:", err);
        return { isDuplicate: false };
    }
}

/* -------------------------------------------------------------------------- */
/*                       Main Gemini OCR Processing Logic                      */
/* -------------------------------------------------------------------------- */

export async function processImageWithGemini(
    imageUrl: string,
    userId: string // Requirement: context for auditing
): Promise<ExtractedData> {
    const startTime = Date.now();
    let fingerprint = "unknown";

    try {
        console.log("Starting Gemini OCR extraction:", imageUrl);

        /* -------------------------- Fetch Image -------------------------- */

        const imageResp = await fetch(imageUrl);
        if (!imageResp.ok) {
            throw new Error(`Failed to fetch image: ${imageResp.statusText}`);
        }

        const mimeType = imageResp.headers.get("content-type") || "image/jpeg";
        const arrayBuffer = await imageResp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fingerprint = generateFingerprint(buffer);
        const base64Image = buffer.toString("base64");

        /* ----------------------- Duplicate Detection ---------------------- */

        const { isDuplicate, duplicateOfId } = await checkDuplicate(fingerprint);

        if (isDuplicate) {
            return {
                documentType: "DUPLICATE",
                cash: 0,
                online: 0,
                expenses: 0,
                total: 0,
                isDuplicate: true,
                duplicateOfId,
                fingerprint,
            };
        }

        /* -------------------------- Gemini Model -------------------------- */

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0,
                topP: 0.1,
                maxOutputTokens: 1200,
                responseMimeType: "application/json",
            },
        });

        const prompt = `
You are an OCR and document validation engine for a retail clothing shop in India.

CONTEXT:
- The documents are handwritten daily sales sheets.
- Dates are often at the top. Extract the date exactly as written.
- "CASH" column usually contains cash sales.
- "ONLINE" column contains UPI/Bank transfers.
- "Kharcha" or "खर्च" or "Exp" refers to EXPENSES. Look for these either as line items or in a summary section at the bottom.

HARD RULES (NON-NEGOTIABLE):
- NEVER guess or invent numbers.
- If a value is unclear, return null.
- If fewer than TWO monetary values are detected, mark documentType = "INVALID".
- Prefer UNKNOWN over incorrect classification.
- LANGUAGE: The sheet may use English, Hindi, or Hinglish (e.g., "Kharcha" or "खर्च").

TASK:
1. Determine whether the image is a valid handwritten daily sales sheet.
2. If VALID:
   - Extract the date written on the sheet.
   - Extract individual line items.
   - Classify each line as: CASH_SALE | ONLINE_SALE | EXPENSE | TOTAL_WRITTEN | UNRELATED_TEXT | UNKNOWN
   - Capture ALL readable text. If it doesn't fit into sales/expenses, put it in "miscellaneousNotes".
   - Identify "Kharcha", "खर्च", "EXP", "Less", or "-" followed by a number as EXPENSES.

OUTPUT (STRICT JSON ONLY):
{
  "documentType": "VALID | INVALID",
  "dateOnSheet": "string | null",
  "cashTotal": number | null,
  "onlineTotal": number | null,
  "expenseTotal": number | null,
  "writtenTotal": number | null,
  "netTotal": number | null,
  "lineItems": [
    {
      "classification": "CASH_SALE | ONLINE_SALE | EXPENSE | TOTAL_WRITTEN | UNRELATED_TEXT | UNKNOWN",
      "content": string,
      "amount": number | null
    }
  ],
  "miscellaneousNotes": "string | null",
  "confidenceScore": number,
  "riskFlags": string[]
}
`;

        /* -------------------------- Gemini Call --------------------------- */

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType } },
        ]);

        const text = result.response.text();
        const rawJson = JSON.parse(text);

        /* ------------------------ Zod Validation ------------------------- */

        const validatedData = GeminiOutputSchema.safeParse(rawJson);

        if (!validatedData.success) {
            console.error("Zod Validation Failed:", validatedData.error);
            throw new Error("AI output failed schema validation");
        }

        const data = validatedData.data;

        /* -------------------------- FINAL OUTPUT -------------------------- */

        const extractedData: ExtractedData = {
            documentType: data.documentType === "VALID" ? "SALES_SHEET" : "INVALID",
            cash: Number(data.cashTotal) || 0,
            online: Number(data.onlineTotal) || 0,
            expenses: Number(data.expenseTotal) || 0,
            total: Number(data.netTotal) || 0,
            rawLines: (data.lineItems || []) as ExtractedLine[],
            confidence: data.confidenceScore,
            riskFlags: data.riskFlags,
            dateOnSheet: data.dateOnSheet,
            notes: data.miscellaneousNotes,
            isDuplicate: false,
            fingerprint,
        };

        // Audit Log
        await logOcrAttempt({
            imageUrl,
            fingerprint,
            rawResponse: rawJson,
            extractedData,
            userId,
            createdAt: Date.now(),
            durationMs: Date.now() - startTime
        });

        return extractedData;

    } catch (error: any) {
        const errorMsg = error.message || "Unknown error";
        console.error("CRITICAL OCR FAILURE", {
            message: errorMsg,
            imageUrl,
            timestamp: new Date().toISOString(),
        });

        // Log the failure
        await logOcrAttempt({
            imageUrl,
            fingerprint,
            rawResponse: null,
            extractedData: {
                documentType: "INVALID",
                cash: 0, online: 0, expenses: 0, total: 0,
                isDuplicate: false, fingerprint
            },
            error: errorMsg,
            userId,
            createdAt: Date.now(),
            durationMs: Date.now() - startTime
        });

        throw new Error(`AI Extraction Failed: ${errorMsg}`);
    }
}
