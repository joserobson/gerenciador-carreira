import { NextResponse } from "next/server";
import { askLocalAI, Provider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { platformName, provider = "gemini" } = await req.json();

    if (!platformName) {
      return NextResponse.json({ error: "Missing platformName" }, { status: 400 });
    }

    const platform = await prisma.platform.findUnique({
      where: { name: platformName.toLowerCase() }
    });

    if (!platform || !platform.fieldsSchema) {
      return NextResponse.json({ error: "A plataforma não foi mapeada previamente. Aperte em 'Mapear Plataforma' primeiro." }, { status: 400 });
    }

    const user = await prisma.userProfile.findFirst();
    const projects = await prisma.project.findMany();

    if (!user) {
      return NextResponse.json({ error: "Perfil não encontrado. Otimize primeiro o seu PDF de Base na tela principal." }, { status: 400 });
    }

    const userDataText = `
      Nome: ${user.name || "N/A"}
      Cargo: ${user.title || "N/A"}
      Resumo: ${user.summary || "N/A"}
      Habilidades Técnicas: ${user.skills.join(", ")}
    `;

    const projectsText = projects.map(p => `
      Projeto: ${p.name}
      Atuação: ${(p as any).role}
      Tecnologias: ${p.technologies.join(", ")}
      Desafios que enfrentei: ${p.challenges || "N/A"}
      Soluções que criei: ${p.solutions || "N/A"}
    `).join("\n---");

    const prompt = `Você é um Robô Preenchedor de Formulários.
Aqui está a estrutura em JSON obrigatória que mapeia todos os campos da plataforma de recrutamento "${platform.name}".

ESTRUTURA EXIGIDA:
${platform.fieldsSchema}

Sua Tarefa: Re-escreva EXATAMENTE esse mesmo JSON, preenchendo todos os "valor:" ou "sugestao:" ou os campos correspondentes com as informações reais do candidato. Transforme dicas soltas em RESPOSTAS PRONTAS redigidas em português profissional e persuasivo.

-- DADOS DO CANDIDATO --
${userDataText}

-- HISTÓRICO DE PROJETOS E EXPERIÊNCIAS NO CÓDIGO (USE COMO EXPERIÊNCIA PROFISSIONAL) --
${projectsText}

Retorne APENAS UM JSON VÁLIDO contendo o formulário completamente respondido. Não responda com explicações nem marcações Markdown (sem \`\`\`json). Devolva apenas as chaves curtas para leitura fácil via máquina.
`;

    const filledResult = await askLocalAI(prompt, provider as Provider);

    let cleanJsonStr = filledResult.replace(/```json/ig, "").replace(/```/g, "").trim();

    // Validar JSON
    try {
      JSON.parse(cleanJsonStr);
    } catch {
      return NextResponse.json({ error: "A IA encontrou dificuldade de mapear os dados em formato JSON estrito para o preenchimento. Tente rodar pelo Gemini se usou o Claude." }, { status: 500 });
    }

    // Salvar Dados
    const platformData = await prisma.platformData.create({
      data: {
        platformId: platform.id,
        data: cleanJsonStr
      }
    });

    return NextResponse.json({
      message: "Formulários preenchidos milimetricamente com sucesso!",
      data: JSON.parse(cleanJsonStr)
    });

  } catch (error: any) {
    console.error("API Error in fill-platform:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
