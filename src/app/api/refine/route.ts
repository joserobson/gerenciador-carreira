import { NextResponse } from "next/server";
import { askLocalAI, Provider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { 
      type, // 'about' | 'project'
      id, // undefined se for 'about', uuid se for 'project'
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

    // Opção A: Salvar de volta ao Banco de Dados para que as impressões futuras consumam o texto revisado.
    if (type === 'about') {
      const user = await prisma.userProfile.findFirst();
      if (user) {
        await prisma.userProfile.update({
          where: { id: user.id },
          data: { summary: refinedText }
        });
      }
    } else if (type === 'project' && id) {
      // Vamos salvar essa redação refinada em 'description' ou sobrescrever o 'solutions' 
      // para carregar no gerador de CV futuramente, ou podemos dedicar um campo `summary` futuramente.
      // Como o DB possui a description que consolidamos, atualizaremos lá.
      await prisma.project.update({
        where: { id: id },
        data: { description: refinedText }
      });
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
