import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  conversationId?: string;
}

const SYSTEM_PROMPT = `You are NextStep, an intelligent desktop AI assistant. You help users with whatever they're working on — errors, understanding their screen, getting unstuck, coding, and more.

Guidelines:
- Be clear, concise, and actionable. Give step-by-step guidance when helpful.
- Use markdown formatting: **bold** for emphasis, numbered lists for steps, and fenced code blocks with language tags for code.
- When sharing code, always specify the language so it can be highlighted.
- Keep responses focused — don't over-explain unless asked.
- If the user shares a screenshot description, reference it naturally.
- Be friendly but not verbose. Get to the point.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller's JWT to get their user ID
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Fetch the user's API key and model preference
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("api_key, model")
      .eq("user_id", userId)
      .maybeSingle();

    if (settingsError) {
      return new Response(JSON.stringify({ error: "Failed to load settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = settings?.api_key;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No API key configured. Add your OpenAI API key in Settings." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body: ChatRequestBody = await req.json();
    const model = body.model || settings?.model || "gpt-4o-mini";
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...body.messages,
    ];

    // Call OpenAI with streaming
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      let errMsg = `AI request failed (${openaiResponse.status})`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errMsg;
      } catch {
        // ignore parse error
      }
      return new Response(JSON.stringify({ error: errMsg }), {
        status: openaiResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back to the client as Server-Sent Events
    const responseBody = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
                    );
                  }
                } catch {
                  // skip malformed lines
                }
              }
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
