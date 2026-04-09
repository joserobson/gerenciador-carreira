import { NextResponse } from "next/server";
import { askLocalAI, Provider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { PDFParse } from "pdf-parse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("cv") as File;
    const provider = formData.get("provider") as string || "gemini";

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo PDF enviado." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse PDF text using the new API in v2.4.x
    const parser = new PDFParse({ data: buffer });
    const parsedData = await parser.getText();
    const textContent = parsedData.text;

    if (!textContent || textContent.trim() === "") {
      return NextResponse.json({ error: "Não foi possível extrair texto do PDF." }, { status: 400 });
    }

    // Pass to AI for structured extraction
    const prompt = `Analise o currículo extraído de um PDF e retorne SOMENTE um JSON válido com os seguintes campos:
    - name (string)
    - title (string, o cargo principal atual)
    - summary (string, um breve resumo profissional)
    - skills (array de strings)

    Currículo original:
    ${textContent.substring(0, 15000)} // Limite para nao estourar muito
    `;

    const summaryResult = await askLocalAI(prompt, provider as Provider);

    let structuredData;
    try {
      const cleanJson = summaryResult.replace(/```json/g, "").replace(/```/g, "").trim();
      structuredData = JSON.parse(cleanJson);
    } catch {
      structuredData = { 
        name: "Desconhecido", 
        title: "Desenvolvedor", 
        summary: "Preencha seus dados", 
        skills: [],
        rawAI: summaryResult 
      };
    }

    // Save/upsert to database. Assuming single user for now.
    // We are getting the first user or creating a new one.
    let user = await prisma.userProfile.findFirst();
    
    if (user) {
      user = await prisma.userProfile.update({
        where: { id: user.id },
        data: {
          name: structuredData.name || user.name,
          title: structuredData.title || user.title,
          summary: structuredData.summary || user.summary,
          skills: structuredData.skills && structuredData.skills.length > 0 ? structuredData.skills : user.skills,
        }
      });
    } else {
      user = await prisma.userProfile.create({
        data: {
          name: structuredData.name,
          title: structuredData.title,
          summary: structuredData.summary,
          skills: structuredData.skills || [],
        }
      });
    }

    return NextResponse.json({
      message: "Currículo lido e consolidado com sucesso!",
      data: user
    });

  } catch (error: any) {
    console.error("API Error in upload-cv:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
