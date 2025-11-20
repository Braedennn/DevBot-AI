
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 string
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  error?: boolean;
  attachments?: Attachment[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentStreamingId: string | null;
}

export type ChatMode = 'standard' | 'search' | 'thinking';
export type BotVersion = 'devbot' | 'noire';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  mode: ChatMode;
  botVersion?: BotVersion;
}
