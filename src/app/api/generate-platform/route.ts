import { NextResponse } from "next/server";
import { askLocalAI, Provider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { platformName, provider = "gemini" } = await req.json();

    if (!platformName) {
      return NextResponse.json({ error: "Missing platformName" }, { status: 400 });
    }

    const lowerName = platformName.toLowerCase();

    // 1. Tentar ler de Presets Locais (Prioridade: Específico > Geral)
    try {
      const specificPath = path.join(process.cwd(), "docs", `${lowerName}-schema.json`);
      const generalPath = path.join(process.cwd(), "docs", "exemplo-plataforma.json");
      
      let presetData = null;
      let usedFile = "";

      if (fs.existsSync(specificPath)) {
        presetData = JSON.parse(fs.readFileSync(specificPath, "utf-8"));
        usedFile = `${lowerName}-schema.json`;
      } else if (fs.existsSync(generalPath)) {
        const allPresets = JSON.parse(fs.readFileSync(generalPath, "utf-8"));
        const presetKey = `perfil_${lowerName}`;
        if (allPresets[presetKey]) {
          presetData = allPresets[presetKey];
          usedFile = "exemplo-plataforma.json";
        }
      }

      if (presetData) {
        console.log(`[Platform Base] Found local preset for ${platformName} in ${usedFile}. Skipping AI Map.`);
        const presetSchema = JSON.stringify(presetData);
        
        const platform = await prisma.platform.upsert({
          where: { name: lowerName },
          update: { fieldsSchema: presetSchema },
          create: {
            name: lowerName,
            description: `Mapeado automaticamente via Preset Local (${usedFile}).`,
            fieldsSchema: presetSchema
          }
        });

        return NextResponse.json({
          message: `Plataforma ${platform.name} mapeada com sucesso (via Cache Local/Preset)!`,
          data: platform
        });
      }
    } catch (e) {
      console.warn("Could not load local presets or they are invalid.");
    }

    // 2. Se não tem preset, manda pra IA de forma OTIMIZADA.
    console.log(`[Platform AI] No preset found. Querying AI for ${platformName}...`);
    const prompt = `Você é um Analista de Recrutamento especialista em plataformas.
Mapeie os formulários e campos necessários para cadastro de currículo na plataforma "${platformName}".
Se puder, pesquise na web.

Retorne APENAS um JSON reduzido e direto, seguindo esta estrutura OBRIGATÓRIA:
{
  "etapa_1_nome": {
    "campos": [
      { "campo": "Nome do Campo", "obrigatorio": true, "dica": "Instrução breve" }
    ]
  }
}
Não inclua textos enormes, apenas o mapeamento cirúrgico de cada etapa (Ex: Pessoais, Experiências, Habilidades).
`;

    let result = "";
    // Simple retry logic to handle capacity exhaustion
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await askLocalAI(prompt, provider as Provider);
        break; // Success
      } catch (err: any) {
        if (attempt === 3) throw err;
        console.log(`[Platform AI] Attempt ${attempt} failed, retrying in 3s...`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    let cleanJsonStr = result.replace(/```json/ig, "").replace(/```/g, "").trim();

    try {
      JSON.parse(cleanJsonStr);
    } catch (e) {
      return NextResponse.json({ error: "A IA retornou um formato JSON inválido devido à exaustão de tokens ou falha de formatação." }, { status: 500 });
    }

    const platform = await prisma.platform.upsert({
      where: { name: lowerName },
      update: { fieldsSchema: cleanJsonStr },
      create: {
        name: lowerName,
        description: `Mapeado ativamente via Web Search IA.`,
        fieldsSchema: cleanJsonStr
      }
    });

    return NextResponse.json({
      message: `Plataforma ${platform.name} mapeada com sucesso via IA!`,
      data: platform
    });

  } catch (error: any) {
    console.error("API Error in generate-platform:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
