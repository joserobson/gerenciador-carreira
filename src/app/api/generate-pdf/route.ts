import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { language = "pt" } = await req.json();

    const user = await prisma.userProfile.findFirst();
    const projects = await prisma.project.findMany();

    if (!user) {
      return NextResponse.json(
        { error: "Nenhum Perfil de Usuário encontrado. Faça o upload do CV primeiro." },
        { status: 400 }
      );
    }

    const langLabels = language === "en"
      ? { about: "About", skills: "Skills", experience: "Experience", contact: "Contact", challenges: "Challenges", solutions: "Solutions", technologies: "Technologies", role: "Role" }
      : { about: "Sobre", skills: "Habilidades", experience: "Experiência", contact: "Contato", challenges: "Desafios", solutions: "Soluções", technologies: "Tecnologias", role: "Papel" };

    const html = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Currículo - ${user.name || "Profissional"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #1a1a2e;
      background: #fff;
      line-height: 1.6;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #f97316;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .header-left h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .header-left .title {
      font-size: 14px;
      color: #f97316;
      font-weight: 600;
      margin-top: 4px;
    }
    .header-right {
      text-align: right;
      font-size: 11px;
      color: #64748b;
      line-height: 1.8;
    }
    .header-right a { color: #f97316; text-decoration: none; }

    /* Section */
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #f97316;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 14px;
    }

    /* About */
    .about-text {
      color: #374151;
      font-size: 12px;
      line-height: 1.7;
    }

    /* Skills */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .skill-tag {
      background: #f1f5f9;
      color: #475569;
      font-size: 10px;
      font-weight: 500;
      padding: 3px 10px;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
    }

    /* Project */
    .project {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .project:last-child { border-bottom: none; margin-bottom: 0; }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
    }
    .project-name {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .project-role {
      font-size: 10px;
      color: #f97316;
      font-weight: 500;
    }
    .project-tech {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .project-detail-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 2px;
    }
    .project-detail-text {
      font-size: 11px;
      color: #374151;
      margin-bottom: 8px;
    }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 24px; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>${user.name || "Profissional"}</h1>
      <div class="title">${user.title || ""}</div>
    </div>
    <div class="header-right">
      ${user.email ? `<div>${user.email}</div>` : ""}
      ${user.portfolio ? `<div><a href="${user.portfolio}">${user.portfolio}</a></div>` : ""}
    </div>
  </div>

  <!-- About -->
  ${user.summary ? `
  <div class="section">
    <div class="section-title">${langLabels.about}</div>
    <p class="about-text">${user.summary.replace(/\n/g, "<br>")}</p>
  </div>` : ""}

  <!-- Skills -->
  ${user.skills?.length > 0 ? `
  <div class="section">
    <div class="section-title">${langLabels.skills}</div>
    <div class="skills-grid">
      ${user.skills.map((s: string) => `<span class="skill-tag">${s}</span>`).join("")}
    </div>
  </div>` : ""}

  <!-- Projects / Experience -->
  ${projects.length > 0 ? `
  <div class="section">
    <div class="section-title">${langLabels.experience}</div>
    ${projects.map(p => `
    <div class="project">
      <div class="project-header">
        <span class="project-name">${p.name}</span>
        <span class="project-role">${(p as any).role || ""}</span>
      </div>
      <div class="project-tech">${langLabels.technologies}: ${p.technologies.join(", ")}</div>
      ${p.challenges ? `<div class="project-detail-label">${langLabels.challenges}</div><div class="project-detail-text">${p.challenges}</div>` : ""}
      ${p.solutions ? `<div class="project-detail-label">${langLabels.solutions}</div><div class="project-detail-text">${p.solutions}</div>` : ""}
    </div>`).join("")}
  </div>` : ""}

</div>
</body>
</html>`;

    return NextResponse.json({ html });

  } catch (error: any) {
    console.error("API Error in generate-pdf:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
