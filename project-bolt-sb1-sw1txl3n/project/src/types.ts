export type Theme = 'dark' | 'light';
export type Accent = 'ice' | 'violet';

export interface AppPreferences {
  pinOnTop: boolean;
  model: string;
  theme: Theme;
  accent: Accent;
  enableAnimations: boolean;
  apiKey: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  hasAttachment: boolean;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export type QuickActionId = 'understand' | 'error' | 'unstuck';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
}
