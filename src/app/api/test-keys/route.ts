import { NextResponse } from "next/server";

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

  const results = {
    cerebras: { status: "missing", message: "Key Vazia no .env" },
    groq: { status: "missing", message: "Key Vazia no .env" },
    openRouter: { status: "missing", message: "Key Vazia no .env" },
  };

  if (cerebrasKey?.trim()) {
    try {
      console.log("[Test] Pinging Cerebras...");
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${cerebrasKey.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3.1-8b", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 })
      });
      if (res.ok) {
        results.cerebras = { status: "ok", message: "Online e Autenticado! 🟢" };
      } else {
        const errorText = await res.text();
        results.cerebras = { status: "error", message: `Recusado (${res.status}): ${errorText.substring(0, 50)} 🔴` };
      }
    } catch (e: any) {
      results.cerebras = { status: "error", message: `Erro de Conexão: ${e.message} 🔴` };
    }
  }

  if (groqKey?.trim()) {
    try {
      console.log("[Test] Pinging Groq...");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5
        })
      });
      if (res.ok) {
        results.groq = { status: "ok", message: "Online e Autenticado! 🟢" };
      } else {
        const errorText = await res.text();
        results.groq = { status: "error", message: `Recusado (${res.status}): ${errorText.substring(0, 50)} 🔴` };
      }
    } catch (e: any) {
      results.groq = { status: "error", message: `Erro de Conexão: ${e.message} 🔴` };
    }
  }

  if (openRouterKey?.trim()) {
    try {
      console.log("[Test] Pinging OpenRouter...");
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct:free",
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5
        })
      });
      if (res.ok) {
        results.openRouter = { status: "ok", message: "Online e Autenticado! 🟢" };
      } else {
        const errorText = await res.text();
        results.openRouter = { status: "error", message: `Recusado (${res.status}): ${errorText.substring(0, 50)} 🔴` };
      }
    } catch (e: any) {
      results.openRouter = { status: "error", message: `Erro de Conexão: ${e.message} 🔴` };
    }
  }

  return NextResponse.json(results);
}
