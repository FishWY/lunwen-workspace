import { pdfjs } from 'react-pdf';

// Configure worker (if not already configured in components)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Extract text from PDF with page markers for source grounding
 * Format: [Page 1] text... [Page 2] text...
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        const maxPages = Math.min(pdf.numPages, 5); // First 5 pages only
        let fullText = '';

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Add page marker
            fullText += `[Page ${pageNum}]\n`;

            // Extract text items
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        throw error;
    }
};

/**
 * Legacy function - extract text from PDF URL
 */
export const extractTextFromPdf = async (pdfUrl: string): Promise<string> => {
    try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        let fullText = '';
        const numPages = Math.min(pdf.numPages, 10);

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + ' ';
        }

        return fullText;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        return 'Failed to extract text from PDF.';
    }
};
