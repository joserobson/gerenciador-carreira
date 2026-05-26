import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { versionId } = await req.json();

    const version = await prisma.resumeVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) {
      return NextResponse.json({ error: "Versão não encontrada." }, { status: 404 });
    }

    const profileData = version.profile as any;
    const projectsData = version.projects as any[];

    // 1. Restaurar Perfil
    let activeProfile = await prisma.userProfile.findFirst();
    if (activeProfile) {
      await prisma.userProfile.update({
        where: { id: activeProfile.id },
        data: {
          name: profileData.name,
          email: profileData.email,
          title: profileData.title,
          summary: profileData.summary,
          skills: profileData.skills,
          portfolio: profileData.portfolio,
          professionalSite: profileData.professionalSite,
          cvPath: profileData.cvPath
        }
      });
    } else {
      await prisma.userProfile.create({
        data: {
          name: profileData.name,
          email: profileData.email,
          title: profileData.title,
          summary: profileData.summary,
          skills: profileData.skills,
          portfolio: profileData.portfolio,
          professionalSite: profileData.professionalSite,
          cvPath: profileData.cvPath
        }
      });
    }

    // 2. Restaurar Projetos
    // Primeiro limpamos os projetos atuais
    await prisma.project.deleteMany({});
    
    // Recriamos cada um a partir do snapshot
    for (const p of projectsData) {
      await prisma.project.create({
        data: {
          name: p.name,
          localPath: p.localPath,
          description: p.description,
          role: p.role,
          technologies: p.technologies,
          challenges: p.challenges,
          solutions: p.solutions,
          includeInResume: p.includeInResume ?? true,
          includeResultsInResume: p.includeResultsInResume ?? true,
          resumeOrder: p.resumeOrder ?? null,
          lastAnalysedAt: p.lastAnalysedAt ? new Date(p.lastAnalysedAt) : null
        }
      });
    }

    return NextResponse.json({
      message: `Versão "${version.name}" restaurada com sucesso!`,
      data: { profile: profileData, projects: projectsData }
    });

  } catch (error: any) {
    console.error("API Error in restore version:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
