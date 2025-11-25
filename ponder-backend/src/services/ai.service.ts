import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface MindMapNode {
    label: string;
    quote?: string;
    page?: number;
    children?: MindMapNode[];
}

export interface MindMapResponse {
    root: string;
    children: MindMapNode[];
}

/**
 * Generate Mind Map from PDF text with source grounding
 */
export async function generateMindMap(pdfText: string): Promise<MindMapResponse> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are a structural analyst. Analyze the following text and generate a hierarchical Mind Map with SOURCE GROUNDING.

**CRITICAL LANGUAGE RULES:**
1. **"root" and "label" fields**: MUST be in **Simplified Chinese (简体中文)**. Translate the concepts/titles into Chinese.
2. **"quote" field**: MUST be **EXACTLY** verbatim from the source text. **ABSOLUTELY NO TRANSLATION**.
   - If the source text is English, the "quote" MUST be English.
   - If the source text is Chinese, the "quote" MUST be Chinese.
   - The frontend highlights this text by matching it against the PDF. If you translate it, highlighting will FAIL.

**Structure:**
{
  "root": "Main Concept Title (Chinese)",
  "children": [
    { 
      "label": "Sub-concept A (Chinese)", 
      "quote": "Exact verbatim sentence from the source text (Original Language)",
      "page": 1,
      "children": [...] 
    }
  ]
}

**Requirements:**
1. "quote" MUST be a verbatim string (exact text) from the source.
2. "page" should be the best estimate of the location.
3. Keep quotes concise but meaningful (1-2 sentences).
4. Include 3-4 levels of hierarchy to ensure depth.
5. Generate 5-8 main concepts to cover the document broadly.
6. Each main concept MUST have at least 3-4 sub-concepts.
7. Ensure comprehensive coverage of the document's key arguments and evidence.
8. "quote" MUST be a full sentence or short paragraph (20-50 words) to provide context.
9. "page" is MANDATORY. If not explicitly marked, infer it from the logical flow.

Text to analyze:
${pdfText}
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        console.log("Raw AI Response:", textResponse); // Debug log

        // Sanitize response - handle markdown blocks and potential leading/trailing text
        let cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find the first '{' and last '}' to extract JSON object if there's extra text
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error generating mind map:', error);
        // Don't throw immediately, let the controller handle it, but log details
        throw error;
    }
}

/**
 * Generate Deep Dive explanation for a specific concept
 */
export async function generateDeepDive(
    concept: string,
    contextText: string
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an expert analyst. Based on the following document context, elaborate on this specific concept in detail. Provide insights, examples, and deeper analysis.

**Concept to explain:**
${concept}

**Document context:**
${contextText.substring(0, 8000)}

Please provide a comprehensive explanation in markdown format.
**Language Requirement:** The explanation MUST be in Simplified Chinese (简体中文).`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating deep dive:', error);
        throw new Error('Failed to generate deep dive');
    }
}

/**
 * Stream chat response
 */
export async function* streamChatResponse(
    messages: Array<{ role: string; content: string }>,
    contextText: string
): AsyncGenerator<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemContext = `You are an AI assistant helping analyze a document. Here's the document context:\n\n${contextText.substring(0, 5000)}`;

    const conversationHistory = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

    const prompt = `${systemContext}\n\nConversation:\n${conversationHistory}\n\nassistant (Answer in Simplified Chinese):`;

    try {
        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                yield text;
            }
        }
    } catch (error) {
        console.error('Error streaming chat:', error);
        throw new Error('Failed to stream chat response');
    }
}
