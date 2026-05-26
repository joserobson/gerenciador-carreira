import { prisma } from "@/lib/prisma";
import CVClient from "./CVClient";
import { sortResumeProjects } from "@/lib/resumeProjectSort";

export const dynamic = "force-dynamic";

export default async function CVPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; provider?: string; github?: string; linkedin?: string; site?: string; }>;
}) {
  const params = await searchParams;
  const language = params.lang === "en" ? "en" : "pt";
  const provider = params.provider === "claude" ? "claude" : "gemini";
  const github = params.github || "";
  const linkedin = params.linkedin || "";

  const user = await prisma.userProfile.findFirst();
  const projects = sortResumeProjects(await prisma.project.findMany({
    where: { includeInResume: true },
    orderBy: { createdAt: "desc" },
  }));

  if (!user) {
    return (
      <div className="p-8 text-white min-h-screen">
        <h1 className="text-2xl font-bold">Perfil não encontrado.</h1>
        <p>Por favor, faça o upload do seu CV na tela anterior primeiro.</p>
      </div>
    );
  }

  const professionalSite = params.site || user.professionalSite || "";

  return (
    <CVClient
      language={language}
      provider={provider}
      github={github}
      linkedin={linkedin}
      professionalSite={professionalSite}
      user={{
        name: user.name,
        email: user.email,
        title: user.title,
        summary: user.summary,
        skills: user.skills,
      }}
      projects={projects.map((project) => ({
        id: project.id,
        name: project.name,
        company: project.company,
        startDate: project.startDate,
        endDate: project.endDate,
        jobTitle: project.jobTitle,
        role: project.role,
        technologies: project.technologies,
        challenges: project.challenges,
        solutions: project.solutions,
        includeResultsInResume: project.includeResultsInResume,
        resumeOrder: project.resumeOrder,
      }))}
    />
  );
}
