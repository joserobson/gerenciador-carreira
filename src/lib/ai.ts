import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const execAsync = promisify(exec);

export type Provider = 'gemini' | 'claude';
export type Tier = 'light' | 'heavy';

async function callFreeCloudAPI(prompt: string): Promise<string> {
  const keys = {
    groq: process.env.GROQ_API_KEY,
    openRouter: process.env.OPENROUTER_API_KEY,
    cerebras: process.env.CEREBRAS_API_KEY
  };

  const adapters = [];

  if (keys.cerebras) {
    adapters.push({
      name: "Cerebras (Llama 3.1)",
      execute: async () => {
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${keys.cerebras}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.1-8b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1
          })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content;
      }
    });
  }

  if (keys.groq) {
    adapters.push({
      name: "Groq (Llama 3)",
      execute: async () => {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${keys.groq}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1
          })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content;
      }
    });
  }

  if (keys.openRouter) {
    adapters.push({
      name: "OpenRouter (Llama 3 Free)",
      execute: async () => {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${keys.openRouter}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "meta-llama/llama-3-8b-instruct:free",
            messages: [{ role: "user", content: prompt }]
          })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content;
      }
    });
  }

  if (adapters.length === 0) {
    throw new Error("No free cloud keys provided in .env");
  }

  // Load Balancing: Embaralhar os adaptadores disponíveis para revezamento (evita esgotar Rate Limit de uma única API)
  const shuffledAdapters = adapters.sort(() => Math.random() - 0.5);

  let lastError = null;

  for (const adapter of shuffledAdapters) {
    try {
      console.log(`[AI LoadBalancer] Routing 'light' task to ${adapter.name}...`);
      const result = await adapter.execute();
      if (result) return result;
    } catch (e: any) {
      console.warn(`[AI LoadBalancer] ${adapter.name} failed: ${e.message}. Falling back to next...`);
      lastError = e;
    }
  }

  throw new Error("All cloud providers failed: " + (lastError?.message || "Unknown error"));
}

export async function askLocalAI(
  prompt: string, 
  provider: Provider = 'gemini', 
  tier: Tier = 'heavy'
): Promise<string> {
  // Se tier for 'light', tentamos as APIs gratuitas primeiro!
  if (tier === 'light') {
    try {
      return await callFreeCloudAPI(prompt);
    } catch (e) {
      console.log("[AI] Cloud APIs unavailable or failed. Falling back to heavy local CLI:", provider);
    }
  }

  const tmpFilePath = path.join(process.cwd(), '.next', `prompt_${crypto.randomUUID()}.txt`);
  await fs.writeFile(tmpFilePath, prompt, 'utf-8');

  try {
    let cmd = '';
    
    if (provider === 'gemini') {
      cmd = `cmd /c "type ${tmpFilePath} | gemini"`;
    } else if (provider === 'claude') {
      cmd = `cmd /c "type ${tmpFilePath} | claude -p"`;
    }

    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 }); 
    
    if (stderr && stderr.trim().length > 0) {
      console.warn(`[AI CLI WARN] ${provider}: ${stderr}`);
    }
    
    return stdout.trim();
  } catch (error: any) {
    console.error(`Error with ${provider} CLI:`, error);
    const errText = String(error?.message || error?.stderr || error?.stdout || error);
    
    if (errText.includes('RESOURCE_EXHAUSTED') || errText.includes('MODEL_CAPACITY_EXHAUSTED')) {
      throw new Error(`Ocorreu um erro técnico na plataforma da IA (Google/Anthropic) devido à sobrecarga temporária dos servidores deles. Isso NÃO é um problema de limite/cota da sua conta. Por favor, aguarde uns segundos e tente novamente.`);
    }
    
    throw new Error(`Falha na IA (${provider}): ${errText.substring(0, 300)}`);
  } finally {
    try {
      await fs.unlink(tmpFilePath);
    } catch(e) {}
  }
}

export async function analyzeProjectCommits(diffContent: string, projectContext: string = "", provider: Provider = 'gemini') {
  const CHUNK_SIZE = 8000;
  
  const additionalContext = projectContext 
    ? `\n\nCONTEXTO DO PROJETO (README / REPO ROOT):\n${projectContext}\n\nDeduza o Objetivo do Projeto e o Nível de Atuação do desenvolvedor.` 
    : `\n\nDeduza o Nível de Atuação do desenvolvedor baseado se ele mexeu em arquivos crícos de arquitetura ou componentes.`;

  if (diffContent.length <= CHUNK_SIZE) {
    // Standard execution for small diffs - small enough to be light task!
    const prompt = `Analise os seguintes commits do Git e faça um MÍNIMO E BREVE RESUMO das tecnologias, desafios, papel do dev e soluções vistas.${additionalContext}\n\nCommits:\n${diffContent}`;
    
    const partial = await askLocalAI(prompt, provider, 'light'); // Use light tier for initial extraction!
    
    const promptReduce = `Abaixo está um laudo cru. Re-formate estritamente no JSON abaixo:
{ "technologies": ["...", "..."], "challenges": "...", "solutions": "...", "projectDescription": "...", "developerRole": "..." }

Texto Cru:
${partial}`;
      // Use heavy for final high-quality JSON reduction
      return await askLocalAI(promptReduce, provider, 'heavy');
  }

  let chunks = [];
  for (let i = 0; i < diffContent.length; i += CHUNK_SIZE) {
    chunks.push(diffContent.slice(i, i + CHUNK_SIZE));
  }
  
  const MAX_CHUNKS = 10;
  if (chunks.length > MAX_CHUNKS) {
    console.warn(`[AI] Diff is massive. Truncating from ${chunks.length} chunks down to ${MAX_CHUNKS}.`);
    chunks = chunks.slice(0, MAX_CHUNKS);
  }

  console.log(`[AI] Diff processed into ${chunks.length} chunks for Map-Reduce.`);
  
  const partialSummaries: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[AI] Processing chunk ${i + 1}/${chunks.length}...`);
    const promptMap = `Analise EXCLUSIVAMENTE este fragmento de commits do Git e faça um MÍNIMO E BREVE RESUMO das tecnologias, desafios, papel do dev (se toca em arquitetura) e soluções vistas SOMENTE AQUI. Retorne texto livre.${additionalContext}
    
Fragmento:
${chunks[i]}`;

    // HYBRID DELEGATION: Map processes using FREE CLOUD TIER to save credits / rate limits
    const partial = await askLocalAI(promptMap, provider, 'light');
    partialSummaries.push(partial);
    
    // Backoff protection if local fallback occurs
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 1000)); 
    }
  }

  console.log(`[AI] Reducing ${chunks.length} partial summaries into final JSON...`);
  const promptReduce = `Você atua no passo de REDUCTION de um processo Map-Reduce.
Abaixo estão resumos parciais de diferentes grupos de commits de um mesmo projeto.
Agrupe as ideias, remova duplicidades e escreva o laudo final detalhando o "projectDescription" (objetivo / negócio) e o "developerRole" (cargo de fato exercido inferido por essa análise).

Obrigatório retornar puramente no formato JSON abaixo, sem acentos nas chaves:
{ "technologies": ["...", "..."], "challenges": "...", "solutions": "...", "projectDescription": "...", "developerRole": "..." }

RESUMOS PARCIAIS:
${partialSummaries.join('\n\n---\n\n')}
`;

  // Heavy lifting integration formatting uses the Main Local Provider
  return await askLocalAI(promptReduce, provider, 'heavy');
}
