// Supabase Edge Function — LLM Proxy
// Keeps the Groq API key on the server (stored as a Supabase secret).
//
// Deploy:
//   1. Install Supabase CLI: npm i -g supabase
//   2. Link project:         supabase link --project-ref kminhtzjzowsivoqbmfk
//   3. Set secret:           supabase secrets set GROQ_API_KEY=gsk_your_key_here
//   4. Deploy:               supabase functions deploy llm-proxy
//
// The app calls this via supabase.functions.invoke('llm-proxy', { body: ... })

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { messages, max_tokens = 500, temperature = 1 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Read the Groq key from Supabase secrets (NOT shipped to client)
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY secret not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens,
        temperature,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      return new Response(JSON.stringify({ error: `Groq API error: ${groqResponse.status}`, details: errText }), {
        status: groqResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content ?? null;

    return new Response(JSON.stringify({ content }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
