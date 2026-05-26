import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Provider } from "@/lib/ai";
import { translateResumeForDisplay } from "@/lib/resumeTranslation";
import { sortResumeProjects } from "@/lib/resumeProjectSort";

export async function POST(req: Request) {
  try {
    const { provider = "gemini" } = await req.json();
    const selectedProvider: Provider = provider === "claude" ? "claude" : "gemini";

    const user = await prisma.userProfile.findFirst();
    const projects = sortResumeProjects(await prisma.project.findMany({
      where: { includeInResume: true },
      orderBy: { createdAt: "desc" },
    }));

    if (!user) {
      return NextResponse.json(
        { error: "Nenhum Perfil de Usuário encontrado. Faça o upload do CV primeiro." },
        { status: 400 }
      );
    }

    const translation = await translateResumeForDisplay(user, projects, selectedProvider);

    return NextResponse.json({
      message: "Currículo traduzido com sucesso.",
      data: translation,
    });
  } catch (error: any) {
    console.error("API Error in translate-resume:", error);
    return NextResponse.json(
      { error: error.message || "Não foi possível traduzir o currículo." },
      { status: 502 }
    );
  }
}
