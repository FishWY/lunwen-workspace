import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';

export interface ExtractedPdfData {
    text: string;           // Full text with [Page X] markers
    numPages: number;
    fileName: string;
    filePath: string;
}

/**
 * Extract text from PDF with page markers for source grounding
 * This is CRITICAL for frontend highlighting functionality
 */
/**
 * Extract text from PDF with page markers for source grounding
 * This is CRITICAL for frontend highlighting functionality
 */
export async function extractPdfText(filePath: string): Promise<ExtractedPdfData> {
    try {
        const dataBuffer = fs.readFileSync(filePath);

        // Use the render callback to extract text page by page in a single pass
        const options = {
            pagerender: async (pageData: any) => {
                const textContent = await pageData.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                // Return formatted page text with marker
                return `[Page ${pageData.pageIndex + 1}]\n${pageText}\n\n`;
            }
        };

        const data = await pdf(dataBuffer, options);

        // data.text will now contain the concatenated result of our pagerender callback
        const fullText = data.text;

        return {
            text: fullText,
            numPages: data.numpages,
            fileName: path.basename(filePath),
            filePath,
        };
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        throw new Error('Failed to extract PDF text');
    }
}

/**
 * Limit text to first N characters (for API token limits)
 */
export function limitTextSize(text: string, maxChars: number = 20000): string {
    if (text.length <= maxChars) return text;

    // Try to cut at a page boundary
    const truncated = text.substring(0, maxChars);
    const lastPageMarker = truncated.lastIndexOf('[Page');

    if (lastPageMarker > maxChars * 0.8) {
        return truncated.substring(0, lastPageMarker);
    }

    return truncated;
}
