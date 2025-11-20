export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentStreamingId: string | null;
}