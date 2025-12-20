import { ExtractedData } from "./types";
import { processImageWithGemini } from "@/app/actions/extract-sales";

/**
 * Calls the Server Action to process the image using Gemini Vision.
 */
export async function extractSalesData(imageUrl: string, userId: string): Promise<ExtractedData> {
    try {
        // We simply delegate to the server action which has the API key and logic.
        return await processImageWithGemini(imageUrl, userId);
    } catch (error) {
        console.error("AI Service Error:", error);
        // Fallback or re-throw? Re-throwing so UI knows it failed.
        throw error;
    }
}

/**
 * The System Prompt is now handled inside the server action, keeping this file clean.
 */
export const EXTRACTION_SYSTEM_PROMPT = "";

