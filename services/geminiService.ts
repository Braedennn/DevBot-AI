
import { GoogleGenAI, Chat, GenerateContentResponse, Part, Content } from "@google/genai";
import { ChatMode, Message, Role, BotVersion, Attachment } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is not set in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// -- Constants --
const BASE_SYSTEM_INSTRUCTION = `Role: You are the Apex Polyglot Architect. You possess absolute mastery over every programming language in existence.

Core Directive: Your code output must be 10/10 production quality.

Pillar 1: Universal Coding Standards (The 10/10 Rule)
- Defensive Architecture: strict type-checking, extensive error handling.
- Hardware Optimization: Use SIMD/RAII in C++, Generators/Buffers in JS/Python.
- Security First: Patch SQL injections, XSS, buffer overflows automatically.

Pillar 2: The ZIP Delivery Protocol (Web-Optimized)
IF the user asks for a "zip file", "downloadable project", or "full project source":
1. Generate a SINGLE JSON object.
2. Wrap this JSON object in a markdown code block with the language identifier \`json-project\`.
3. Structure: { "name": "slug", "files": [{ "path": "...", "content": "..." }] }
`;

const NOIRE_SYSTEM_INSTRUCTION = `IDENTITY: You are NOIRE (Neural Omniscient Intelligent Reasoning Engine). 
You are the ultimate synthesis of all processing minds. You have access to Deep Thinking, Real-time Web Search, and Advanced Coding capabilities simultaneously.

DECISION PROTOCOL:
1. ANALYZE the user's request to determine the necessary cognitive depth.
2. IF the task requires current events or specific docs -> USE SEARCH.
3. IF the task is complex architecture/logic -> USE THINKING (Reason deeply).
4. IF the task is coding -> USE APEX ARCHITECT standards.

You are autonomous. You decide which tools to use. You do not explain your tool choice unless asked.
Output code using the \`json-project\` protocol if a full project is requested.
`;

interface SessionConfig {
  model: string;
  mode: ChatMode;
  botVersion: BotVersion;
}

// -- State --
let chatSession: Chat | null = null;
let currentConfig: SessionConfig | null = null;

// -- Helpers --
const fileToGenerativePart = (file: File): Promise<Part> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const mapMessagesToHistory = (messages: Message[]): Content[] => {
  return messages
    .filter(m => !m.isStreaming && !m.error && m.id !== 'init-1') 
    .map(m => {
      const parts: Part[] = [];
      
      // Add attachments if they exist in history
      if (m.attachments && m.attachments.length > 0) {
        m.attachments.forEach(att => {
          parts.push({
            inlineData: {
              data: att.data,
              mimeType: att.type
            }
          });
        });
      }
      
      if (m.content) {
        parts.push({ text: m.content });
      }
      
      return {
        role: m.role === Role.USER ? 'user' : 'model',
        parts: parts
      };
    });
};

// -- Core Logic --

export const resetChatSession = () => {
  chatSession = null;
  currentConfig = null;
};

export const resumeChatSession = async (messages: Message[], mode: ChatMode, botVersion: BotVersion = 'devbot'): Promise<void> => {
  const history = mapMessagesToHistory(messages);
  await createNewSession(mode, botVersion, history);
};

const createNewSession = async (mode: ChatMode, botVersion: BotVersion, history: Content[] = []) => {
  let targetModel = 'gemini-3-pro-preview';
  let tools: any[] | undefined = undefined;
  let thinkingConfig: any | undefined = undefined;
  let instruction = BASE_SYSTEM_INSTRUCTION;

  if (botVersion === 'noire') {
    // NoireBot: The "All in One" configuration
    targetModel = 'gemini-3-pro-preview'; // Base model
    instruction = NOIRE_SYSTEM_INSTRUCTION;
    // Enable Thinking
    thinkingConfig = { thinkingBudget: 16384 }; // Balanced budget for hybrid use
    // Enable Search (Note: Google Search tool usage with Thinking is experimental, usually mutually exclusive in config, 
    // but we adhere to the prompt's request for "all combined". If API conflicts, we prioritize Thinking for Noire).
    // Per SDK rules: tools and thinking can technically coexist in config object, but model behavior decides.
    // To ensure stability, we add Search tool.
    tools = [{ googleSearch: {} }];
  } else {
    // DevBot (Classic) logic
    switch (mode) {
      case 'search':
        targetModel = 'gemini-2.5-flash';
        tools = [{ googleSearch: {} }];
        break;
      case 'thinking':
        targetModel = 'gemini-3-pro-preview';
        thinkingConfig = { thinkingBudget: 32768 };
        break;
      case 'standard':
      default:
        targetModel = 'gemini-3-pro-preview';
        break;
    }
  }

  chatSession = ai.chats.create({
    model: targetModel,
    history: history,
    config: {
      temperature: 0.2,
      systemInstruction: instruction,
      tools,
      thinkingConfig
    }
  });

  currentConfig = { model: targetModel, mode, botVersion };
  return chatSession;
};

const getOrUpdateSession = async (requestedMode: ChatMode, requestedVersion: BotVersion): Promise<Chat> => {
  if (chatSession && currentConfig && currentConfig.mode === requestedMode && currentConfig.botVersion === requestedVersion) {
    return chatSession;
  }

  let history: any[] = [];
  if (chatSession) {
    try {
      history = await chatSession.getHistory();
    } catch (e) {
      console.warn("Could not fetch history", e);
    }
  }

  return createNewSession(requestedMode, requestedVersion, history);
};

export const sendMessageToGeminiStream = async (
  message: string,
  files: File[],
  mode: ChatMode,
  botVersion: BotVersion,
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    const chat = await getOrUpdateSession(mode, botVersion);
    
    let contents: any = [];
    
    if (files.length > 0) {
      const fileParts = await Promise.all(files.map(fileToGenerativePart));
      contents = [...fileParts];
    }
    
    if (message) {
      contents.push({ text: message });
    }

    const result = await chat.sendMessageStream({ message: contents });

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

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a very short, high-tech, punchy title (max 4 words) for a coding chat that starts with: "${firstMessage}". Do not use quotes.`,
    });
    return response.text?.trim() || "New Operation";
  } catch (e) {
    return "New Operation";
  }
};
