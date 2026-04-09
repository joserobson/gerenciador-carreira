import { NextResponse } from "next/server";
import { askLocalAI, Provider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { provider = "gemini", language = "pt" } = await req.json();

    const user = await prisma.userProfile.findFirst();
    const projects = await prisma.project.findMany();

    if (!user) {
      return NextResponse.json(
        { error: "Nenhum Perfil de Usuário encontrado. Faça o upload do CV primeiro." },
        { status: 400 }
      );
    }

    const userDataText = `
      Nome: ${user.name || "N/A"}
      Cargo: ${user.title || "N/A"}
      Resumo Anterior: ${user.summary || "N/A"}
      Habilidades: ${user.skills.join(", ")}
    `;

    const projectsText = projects.map(p => `
      Projeto: ${p.name}
      Tecnologias: ${p.technologies.join(", ")}
      Desafios: ${p.challenges || "N/A"}
      Soluções: ${p.solutions || "N/A"}
    `).join("\n---");

    const promptLanguage = language === "en" 
        ? "English (US) focused on global recruiters" 
        : "Português (BR)";

    const prompt = `Você é um Tech Recruiter Senior especialista em LinkedIn Profile Optimization.
Dadas as informações abaixo sobre um profissional e seus projetos recentes extraídos via Git, construa os textos no idioma ${promptLanguage}:

1. Uma seção "Sobre" (About) para o LinkedIn: persuasiva, profissional, destacando resultados, paixão por tecnologia.
2. Para cada um dos projetos listados, gere uma descrição individual seguindo o (método STAR - context, challenge, action, result), adaptando para leitura de headhunters.

Formate a resposta em formato JSON válido e ESTRITAMENTE VÁLIDO contendo as chaves:
{
  "about": "string longa com parágrafos separados via \\n\\n",
  "projects": [
    { "id": "uuid do projeto correspondente", "name": "nome literario", "text": "o texto redigido em padrao STAR" }
  ]
}

-- INFORMAÇÕES DO PROFISSIONAL --
${userDataText}

-- PROJETOS DESENVOLVIDOS RECENTEMENTE --
${projects.map(p => `[ID: ${p.id}] Nome: ${p.name}\nTecnologias: ${p.technologies.join(", ")}\nPapel: ${p.role}\nDesafios: ${p.challenges}`).join("\n---\n")}
`;

    const summaryResult = await askLocalAI(prompt, provider as Provider);

    let structuredData;
    try {
      const cleanJson = summaryResult.replace(/```json/g, "").replace(/```/g, "").trim();
      structuredData = JSON.parse(cleanJson);
    } catch {
      structuredData = { 
        about: "Não foi possível estruturar o retorno em JSON. Veja a resposta bruta gerada.",
        projects: [{ id: "error", name: "Raw Data", text: summaryResult }]
      };
    }

    return NextResponse.json({
      message: "Resumo gerado com sucesso!",
      data: structuredData
    });

  } catch (error: any) {
    console.error("API Error in generate-linkedin:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
