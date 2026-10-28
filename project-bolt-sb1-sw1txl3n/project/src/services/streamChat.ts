import { supabase } from '@/lib/supabase';

export interface StreamMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

/**
 * Streams an AI response from the NextStep edge function.
 * The edge function reads the user's API key from the database — the key
 * never touches the browser.
 */
export async function streamChat(
  messages: StreamMessage[],
  callbacks: StreamCallbacks,
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    callbacks.onError('Not authenticated');
    return;
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  let response: Response;
  try {
    response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ messages }),
    });
  } catch {
    callbacks.onError('Could not reach the AI service. Check your connection.');
    return;
  }

  if (!response.ok) {
    let msg = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      msg = body.error || msg;
    } catch {
      // ignore
    }
    callbacks.onError(msg);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError('No response stream');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          callbacks.onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            callbacks.onToken(parsed.content);
          } else if (parsed.error) {
            callbacks.onError(parsed.error);
            return;
          }
        } catch {
          // skip malformed
        }
      }
    }
    callbacks.onDone();
  } catch {
    callbacks.onError('Stream interrupted');
  }
}
