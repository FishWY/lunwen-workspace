import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateSummary = async (text: string, apiKey: string): Promise<string> => {
    if (!apiKey) return "Please provide an API Key.";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Summarize the following text concisely in markdown format:\n\n${text}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating summary:", error);
        return "Failed to generate summary.";
    }
};

export const generateMindMap = async (text: string, apiKey: string): Promise<any> => {
    if (!apiKey) throw new Error("Please provide an API Key.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a structural analyst. Analyze the following text and generate a hierarchical Mind Map with SOURCE GROUNDING.

    **IMPORTANT:** The text contains page markers like [Page X]. Use these to determine the page number for each concept.

    **Output Requirement:** Return ONLY valid, raw JSON. Do NOT use Markdown code blocks (no \`\`\`json).
    
    **Structure:**
    {
      "root": "Main Concept Title",
      "children": [
        { 
          "label": "Sub-concept A", 
          "quote": "Exact verbatim sentence from the source text that supports this concept",
          "page": 1,
          "children": [...] 
        },
        { 
          "label": "Sub-concept B", 
          "quote": "Another exact quote from the text",
          "page": 2,
          "children": [] 
        }
      ]
    }
    
    **Requirements:**
    1. "quote" MUST be a verbatim string (exact text) from the source.
    2. "page" MUST be inferred from the [Page X] marker that precedes the quote.
    3. Keep quotes concise but meaningful (1-2 sentences).
    4. Only include 2-3 levels of hierarchy maximum.
    
    Text to analyze:
    ${text.substring(0, 10000)}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        // Sanitize
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Error generating mind map:", error);
        throw error;
    }
};

export const generateDeepDive = async (nodeContent: string, contextText: string, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("Please provide an API Key.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert analyst. Based on the following document context, elaborate on this specific concept in detail. Provide insights, examples, and deeper analysis.

    **Concept to explain:**
    ${nodeContent}

    **Document context:**
    ${contextText.substring(0, 8000)}

    Please provide a comprehensive explanation in markdown format.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating deep dive:", error);
        throw error;
    }
};
