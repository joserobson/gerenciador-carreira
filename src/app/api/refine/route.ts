import { NextResponse } from "next/server";
import { askLocalAI, Provider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { 
      type, // 'about' | 'project' | 'platform'
      id, // uuid do registro correspondente
      fieldPath, // opcional: caminho do campo no JSON (ex: 'apresentacao.resumo')
      originalText,
      userPrompt,
      provider = "gemini",
      language = "pt"
    } = await req.json();

    if (!originalText || !userPrompt) {
      return NextResponse.json({ error: "Missing originalText or userPrompt" }, { status: 400 });
    }

    const commandLang = language === "en" ? "English (US)" : "Português (BR)";

    const prompt = `Você é um Assistente de Otimização de Currículos e LinkedIn.
O usuário quer melhorar um texto gerado anteriormente com uma instrução específica.
Instrução do Usuário: "${userPrompt}"

Sua tarefa: Reescreva o texto abaixo seguindo RIGOROSAMENTE a instrução do usuário, mantendo no idioma ${commandLang}. Retorne APENAS o texto revisado pronto para uso, sem aspas e sem explicações extras.

Texto Original:
${originalText}
`;

    const refinedText = await askLocalAI(prompt, provider as Provider);

    // Persistência
    if (type === 'about') {
      const user = await prisma.userProfile.findFirst();
      if (user) {
        await prisma.userProfile.update({
          where: { id: user.id },
          data: { summary: refinedText }
        });
      }
    } else if (type === 'project' && id) {
      await prisma.project.update({
        where: { id: id },
        data: { description: refinedText }
      });
    } else if (type === 'platform' && id && fieldPath) {
      // Localizar o registro de dados da plataforma
      const platformData = await prisma.platformData.findUnique({
        where: { id: id }
      });

      if (platformData) {
        const dataObj = JSON.parse(platformData.data);
        
        // Helper para atualizar objeto aninhado por string path (ex: "apresentacao.resumo")
        const setNestedValue = (obj: any, path: string, val: any) => {
          const keys = path.split('.');
          let current = obj;
          for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) current[key] = {};
            current = current[key];
          }
          current[keys[keys.length - 1]] = val;
        };

        setNestedValue(dataObj, fieldPath, refinedText);

        await prisma.platformData.update({
          where: { id: id },
          data: { data: JSON.stringify(dataObj) }
        });
      }
    }

    return NextResponse.json({
      message: "Texto refinado com sucesso!",
      data: refinedText
    });

  } catch (error: any) {
    console.error("API Error in refine:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
