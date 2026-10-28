import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage, Conversation } from '@/types';

interface DbConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  has_attachment: boolean;
  created_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) {
      setConversations(
        data.map((c: DbConversation) => ({
          id: c.id,
          title: c.title,
          createdAt: new Date(c.created_at).getTime(),
          updatedAt: new Date(c.updated_at).getTime(),
        })),
      );
    }
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(
    async (conversationId: string) => {
      const { data } = await supabase
        .from('messages')
        .select('id, conversation_id, role, content, has_attachment, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (data) {
        setMessages(
          data.map((m: DbMessage) => ({
            id: m.id,
            conversationId: m.conversation_id,
            role: m.role,
            content: m.content,
            hasAttachment: m.has_attachment,
            createdAt: new Date(m.created_at).getTime(),
          })),
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setActiveConversationId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadConversations().then(() => setLoading(false));
  }, [user, loadConversations]);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      setActiveConversationId(conversationId);
      await loadMessages(conversationId);
    },
    [loadMessages],
  );

  const startNewConversation = useCallback(async (title: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title })
      .select('id, title, created_at, updated_at')
      .maybeSingle();

    if (error || !data) return null;

    const conv: Conversation = {
      id: data.id,
      title: data.title,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };

    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(conv.id);
    setMessages([]);
    return conv;
  }, []);

  const addMessage = useCallback(
    async (role: 'user' | 'assistant', content: string, hasAttachment: boolean) => {
      if (!activeConversationId) return null;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          role,
          content,
          has_attachment: hasAttachment,
        })
        .select('id, conversation_id, role, content, has_attachment, created_at')
        .maybeSingle();

      if (error || !data) return null;

      const msg: ChatMessage = {
        id: data.id,
        conversationId: data.conversation_id,
        role: data.role,
        content: data.content,
        hasAttachment: data.has_attachment,
        createdAt: new Date(data.created_at).getTime(),
      };

      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [activeConversationId],
  );

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content } : m)),
    );
  }, []);

  const persistFinalMessage = useCallback(
    async (messageId: string, content: string) => {
      await supabase
        .from('messages')
        .update({ content })
        .eq('id', messageId);
    },
    [],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      await supabase.from('conversations').delete().eq('id', conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      await loadConversations();
    },
    [activeConversationId, loadConversations],
  );

  const renameConversation = useCallback(
    async (conversationId: string, title: string) => {
      await supabase.from('conversations').update({ title }).eq('id', conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title } : c)),
      );
    },
    [],
  );

  return {
    conversations,
    messages,
    activeConversationId,
    loading,
    selectConversation,
    startNewConversation,
    addMessage,
    updateMessageContent,
    persistFinalMessage,
    deleteConversation,
    renameConversation,
    refreshConversations: loadConversations,
  };
}
