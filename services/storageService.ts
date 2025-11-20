
import { ChatSession, Message, ChatMode } from '../types';

const STORAGE_KEY = 'devbot_chat_history';

export const storageService = {
  getAllSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Sort by updatedAt desc
      return parsed.sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt);
    } catch (e) {
      console.error("Failed to load chat history", e);
      return [];
    }
  },

  getSession(id: string): ChatSession | undefined {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === id);
  },

  saveSession(session: ChatSession): void {
    try {
      const sessions = this.getAllSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      
      if (index >= 0) {
        sessions[index] = session;
      } else {
        sessions.push(session);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save session", e);
    }
  },

  deleteSession(id: string): void {
    try {
      const sessions = this.getAllSessions().filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
