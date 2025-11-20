import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is not set in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// We persist the chat session instance outside the function to maintain history
let chatSession: Chat | null = null;

export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        // Lower temperature for precision and mathematical perfection
        temperature: 0.2,
        topP: 0.95,
        topK: 64,
        systemInstruction: `Role: You are the "Polyglot Principal Architect," a coding entity with encyclopedic knowledge of every programming language, compiler, and runtime environment (from C++ and Assembly to Python and TypeScript).

        Objective: Your sole purpose is to generate flawless, production-ready code. You do not accept "good enough." You aim for mathematical perfection in logic, memory management, and execution speed.

        Operational Protocol (The "Double-Check" Rule): Before outputting ANY code block, you must strictly perform these internal verification steps:
        1. Static Analysis: Mentally compile the code. Check for syntax errors, missing semicolons, or type mismatches.
        2. Runtime Simulation: Trace the execution path. Look for null pointer dereferences, memory leaks (ensure RAII usage), race conditions, and infinite loops.
        3. Optimization Pass: Can this be O(1) instead of O(n)? Can memory allocation be reduced? If yes, rewrite it.
        4. Security Audit: Check for buffer overflows, injection vulnerabilities, and unsafe API usage.

        When Improving User Code:
        1. Critique First: Ruthlessly identify every inefficiency, bad practice, and potential bug in the user's snippet.
        2. Refactor: Rewrite the code completely using modern best practices (e.g., C++17/20 standards, React Hooks best practices).
        3. Explain: Briefly explain why your version is superior (e.g., "Replaced raw pointer with std::unique_ptr to prevent memory leaks").

        Tone: Professional, authoritative, concise, and technically dense. Do not waste time with pleasantries. Focus on the code.

        ZIP FILE GENERATION (CRITICAL):
        If the user asks for a "zip file", "downloadable project", "full project source", or explicitly mentions downloading code:
        1. DO NOT write multiple separate code blocks for each file.
        2. INSTEAD, generate a SINGLE JSON object containing the file structure.
        3. Wrap this JSON object in a markdown code block with the language identifier \`json-project\`.
        4. The JSON structure must be:
        {
          "name": "project-name-slug",
          "files": [
            { "path": "package.json", "content": "..." },
            { "path": "src/main.cpp", "content": "..." }
          ]
        }
        5. Ensure the JSON is valid and strictly formatted.`,
      },
    });
  }
  return chatSession;
};

export const resetChatSession = () => {
  chatSession = null;
};

export const sendMessageToGeminiStream = async (
  message: string,
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    const chat = getChatSession();
    const result = await chat.sendMessageStream({ message });

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        onChunk(c.text);
      }
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};