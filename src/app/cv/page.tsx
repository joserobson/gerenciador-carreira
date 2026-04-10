import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

// Forçamos renderização dinâmica para ler searchParams sempre atualizados
export const dynamic = "force-dynamic";

export default async function CVPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; github?: string; linkedin?: string; }>;
}) {
  const params = await searchParams;
  const language = params.lang === "en" ? "en" : "pt";
  const github = params.github || "";
  const linkedin = params.linkedin || "";

  const user = await prisma.userProfile.findFirst();
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (!user) {
    return (
      <div className="p-8 text-white min-h-screen">
        <h1 className="text-2xl font-bold">Perfil não encontrado.</h1>
        <p>Por favor, faça o upload do seu CV na tela anterior primeiro.</p>
      </div>
    );
  }

  const lbl = {
    pt: {
      about: "Resumo Profissional",
      skills: "Habilidades Técnicas",
      experience: "Principais Projetos e Desafios (Git)",
      contact: "Contato & Links",
      print: "Imprimir / Salvar PDF"
    },
    en: {
      about: "Professional Summary",
      skills: "Technical Skills",
      experience: "Key Projects & Challenges (Git)",
      contact: "Contact & Links",
      print: "Print / Save PDF"
    }
  }[language];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 print:py-0 print:bg-white text-gray-900 font-sans">
      
      {/* Botão de Imprimir (Invisível na impressão real) */}
      <div className="fixed top-6 right-6 print:hidden z-50">
        <button 
          id="print-button"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          {lbl.print}
        </button>
        {/* Usamos um hack com "dangerouslySetInnerHTML" para atrelar evento inline onClick pq Server Components não aceitam onClick diretamente */}
        <script dangerouslySetInnerHTML={{__html: `
          document.getElementById('print-button').onclick = () => window.print();
        `}} />
      </div>

      {/* Papel A4 Container */}
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none grid grid-cols-12 overflow-hidden print:overflow-visible">
        
        {/* Coluna Lateral (Sidebar) */}
        <div className="col-span-4 bg-slate-900 text-white p-8 flex flex-col gap-10 print:bg-slate-900 print:text-white" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          
          <div className="space-y-3">
            {/* Foto de Perfil Fictícia ou Avatar Initial */}
            <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold mx-auto border-4 border-slate-600">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h1 className="text-3xl font-extrabold text-center tracking-tight leading-tight">{user.name}</h1>
            <h2 className="text-sm text-cyan-400 font-semibold text-center uppercase tracking-widest">{user.title}</h2>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b border-slate-700 pb-2 uppercase tracking-wide">{lbl.contact}</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {user.email && (
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <span className="break-all">{user.email}</span>
                </li>
              )}
              {linkedin && (
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path></svg>
                  <span className="break-all">{linkedin.replace('https://', '')}</span>
                </li>
              )}
              {github && (
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  <span className="break-all">{github.replace('https://', '')}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b border-slate-700 pb-2 uppercase tracking-wide">{lbl.skills}</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map(skill => (
                <span key={skill} className="px-2 py-1 bg-slate-800 text-xs rounded-md text-slate-200 border border-slate-700" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
        </div>

        {/* Coluna Principal */}
        <div className="col-span-8 p-10 flex flex-col gap-8">
          
          <section className="space-y-3">
            <h3 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 text-gray-800 uppercase tracking-widest">{lbl.about}</h3>
            <p className="text-gray-600 text-sm leading-relaxed text-justify">
              {user.summary}
            </p>
          </section>

          <section className="space-y-6">
            <h3 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 text-gray-800 uppercase tracking-widest">{lbl.experience}</h3>
            
            <div className="space-y-6">
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum projeto indexado via Git Analyzer ainda.</p>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="relative pl-6 border-l-2 border-slate-300 print:break-inside-avoid">
                    <div className="absolute w-3 h-3 bg-cyan-500 rounded-full -left-[7px] top-1.5" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}></div>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-col">
                        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          {project.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 uppercase tracking-wider">
                          <span>{project.company || "Project"}</span>
                          {project.jobTitle && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span>{project.jobTitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider block">
                          {project.startDate || "N/A"} — {project.endDate || "Present"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.technologies.slice(0, 5).map(tech => (
                        <span key={tech} className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {project.challenges && (
                        <div>
                          <strong className="text-gray-700 block">Context & Challenge:</strong>
                          <p className="leading-relaxed">{project.challenges}</p>
                        </div>
                      )}
                      {project.solutions && (
                        <div>
                          <strong className="text-gray-700 block">Action & Result:</strong>
                          <p className="leading-relaxed">{project.solutions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
