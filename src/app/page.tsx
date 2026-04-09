"use client";

import { useState } from "react";

function RefinableBlock({ title, type, id, initialText, provider, language }: any) {
  const [text, setText] = useState(initialText);
  const [prompt, setPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleRefine = async () => {
    if (!prompt.trim()) return;
    setIsRefining(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, originalText: text, userPrompt: prompt, provider, language })
      });
      const data = await res.json();
      if (!data.error && data.data) {
        setText(data.data);
        setPrompt("");
        setIsEditMode(false);
      } else {
        alert(data.error || "Erro ao refinar");
      }
    } catch (e: any) {
      alert("Erro fatal ao conectar IA");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 shadow-lg space-y-4">
      <div className="flex justify-between items-center mb-2">
         <h3 className="font-bold text-orange-400 capitalize">{title}</h3>
         <button onClick={() => setIsEditMode(!isEditMode)} className="text-xs bg-neutral-800 hover:bg-neutral-700 text-orange-300 px-3 py-1 rounded-full transition-colors flex items-center gap-1">
            ✨ Refinar c/ IA
         </button>
      </div>

      <p className="text-sm text-neutral-300 whitespace-pre-wrap">{text}</p>

      {isEditMode && (
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-3 bg-neutral-950 p-3 rounded-md">
           <label className="text-xs font-semibold text-neutral-400">Dica de Refinamento (Ex: "Deixe mais formal e foque em arquitetura")</label>
           <div className="flex gap-2">
             <input
               autoFocus
               type="text"
               value={prompt}
               onChange={e => setPrompt(e.target.value)}
               placeholder="Escreva como a IA deve melhorar esse texto..."
               className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm rounded focus:ring-1 focus:ring-orange-500 outline-none"
             />
             <button 
               onClick={handleRefine} disabled={isRefining}
               className="bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs px-4 py-2 rounded disabled:opacity-50"
             >
               {isRefining ? "Pensando..." : "Aplicar"}
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [provider, setProvider] = useState("gemini");
  const [language, setLanguage] = useState("pt");

  // Key Verifier
  const [testingKeys, setTestingKeys] = useState(false);
  const [keyResults, setKeyResults] = useState<any>(null);

  // States - Git
  const [loadingGit, setLoadingGit] = useState(false);
  const [resultGit, setResultGit] = useState<any>(null);
  const [repoPath, setRepoPath] = useState("d:/ia-workspace/sob-controle");
  const [author, setAuthor] = useState("joserobson");
  const [forceSync, setForceSync] = useState(false);

  // States - CV Upload
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loadingCv, setLoadingCv] = useState(false);
  const [resultCv, setResultCv] = useState<any>(null);

  // States - LinkedIn & CV Gen
  const [loadingLi, setLoadingLi] = useState(false);
  const [resultLi, setResultLi] = useState<any>(null);
  const [githubUrl, setGithubUrl] = useState("https://github.com/joserobson");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/in/joserobson");

  // States - PDF
  const [loadingPdf, setLoadingPdf] = useState(false);

  // States - Platform Hacking (Phase 3)
  const [platformName, setPlatformName] = useState("");
  const [loadingPlatformMap, setLoadingPlatformMap] = useState(false);
  const [loadingPlatformFill, setLoadingPlatformFill] = useState(false);
  const [platformResult, setPlatformResult] = useState<any>(null);

  const handleTestKeys = async () => {
    setTestingKeys(true);
    try {
      const res = await fetch("/api/test-keys");
      const data = await res.json();
      setKeyResults(data);
    } catch (e: any) {
      setKeyResults({ error: "Erro ao testar endpoint de chaves" });
    } finally {
      setTestingKeys(false);
    }
  };

  const handleAnalyzeGit = async () => {
    setLoadingGit(true);
    setResultGit(null);
    try {
      const res = await fetch("/api/git-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath, author, provider, forceSync }),
      });
      const data = await res.json();
      setResultGit(data);
    } catch (e: any) {
      setResultGit({ error: e.message });
    } finally {
      setLoadingGit(false);
    }
  };

  const handleUploadCv = async () => {
    if (!cvFile) return;
    setLoadingCv(true);
    setResultCv(null);
    try {
      const formData = new FormData();
      formData.append("cv", cvFile);
      formData.append("provider", provider);

      const res = await fetch("/api/upload-cv", { method: "POST", body: formData });
      const data = await res.json();
      setResultCv(data);
    } catch (e: any) {
      setResultCv({ error: e.message });
    } finally {
      setLoadingCv(false);
    }
  };

  const handleGenerateLinkedin = async () => {
    setLoadingLi(true);
    setResultLi(null);
    try {
      const res = await fetch("/api/generate-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, language, githubUrl, linkedinUrl }),
      });
      const data = await res.json();
      setResultLi(data);
    } catch (e: any) {
      setResultLi({ error: e.message });
    } finally {
      setLoadingLi(false);
    }
  };

  const handleGeneratePdf = async () => {
    setLoadingPdf(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      // Open HTML in a new tab — user can Ctrl+P to save as PDF
      const win = window.open("", "_blank");
      if (win) { win.document.write(data.html); win.document.close(); }
    } catch (e: any) {
      alert("Erro ao gerar PDF: " + e.message);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleGeneratePlatformSchema = async () => {
    if (!platformName.trim()) return;
    setLoadingPlatformMap(true);
    setPlatformResult(null);
    try {
      const res = await fetch("/api/generate-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformName, provider }),
      });
      const data = await res.json();
      if(data.error) setPlatformResult({ error: data.error });
      else setPlatformResult({ message: data.message, schema: JSON.parse(data.data.fieldsSchema) });
    } catch (e: any) {
      setPlatformResult({ error: e.message });
    } finally {
      setLoadingPlatformMap(false);
    }
  };

  const handleFillPlatformData = async () => {
    if (!platformName.trim()) return;
    setLoadingPlatformFill(true);
    try {
      const res = await fetch("/api/fill-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformName, provider }),
      });
      const data = await res.json();
      setPlatformResult(data);
    } catch (e: any) {
      setPlatformResult({ error: e.message });
    } finally {
      setLoadingPlatformFill(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-2 border-b border-neutral-800 pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">Antigravity Career Manager 🚀</h1>
          <p className="text-neutral-400">Automatize seu currículo, portfólio e formulários (Map-Reduce Cloud Híbrido).</p>
        </header>

        {/* Global Settings */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-inner gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-neutral-400">⚡ CLI Base (Redator Principal):</span>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" value="gemini" checked={provider === "gemini"} onChange={() => setProvider("gemini")} className="text-orange-500 bg-neutral-900 border-neutral-700" />
              Gemini (Google)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" value="claude" checked={provider === "claude"} onChange={() => setProvider("claude")} className="text-orange-500 bg-neutral-900 border-neutral-700" />
              Claude (Anthropic)
            </label>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={handleTestKeys} disabled={testingKeys} className="text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-neutral-300 transition-colors border border-neutral-700">
              {testingKeys ? "Verificando..." : "🔌 Validar Chaves Free"}
            </button>
            <div className="h-6 w-px bg-neutral-700"></div>
            <div className="flex items-center gap-3 text-sm">
               <span className="text-sm font-semibold text-neutral-400">🌐 Idioma Saída:</span>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" value="pt" checked={language === "pt"} onChange={() => setLanguage("pt")} className="text-orange-500 bg-neutral-900 border-neutral-700" />
                 PT-BR
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" value="en" checked={language === "en"} onChange={() => setLanguage("en")} className="text-orange-500 bg-neutral-900 border-neutral-700" />
                 EN-US
               </label>
            </div>
          </div>
        </div>

        {keyResults && (
           <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 text-sm">
              <div className="flex justify-between items-center mb-3"><span className="font-bold text-orange-400">Status das APIs Cloud (Light Tier)</span> <button onClick={() => setKeyResults(null)} className="text-white">✕</button></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-black/50 p-3 rounded-lg border border-neutral-800">
                    <span className="font-bold text-neutral-300">Cerebras:</span> <span className={keyResults.cerebras?.status === 'ok' ? 'text-green-400 ml-2' : keyResults.cerebras?.status === 'missing' ? 'text-neutral-500 ml-2' : 'text-red-400 ml-2'}>{keyResults.cerebras?.message}</span>
                 </div>
                 <div className="bg-black/50 p-3 rounded-lg border border-neutral-800">
                    <span className="font-bold text-neutral-300">Groq:</span> <span className={keyResults.groq?.status === 'ok' ? 'text-green-400 ml-2' : keyResults.groq?.status === 'missing' ? 'text-neutral-500 ml-2' : 'text-red-400 ml-2'}>{keyResults.groq?.message}</span>
                 </div>
                 <div className="bg-black/50 p-3 rounded-lg border border-neutral-800">
                    <span className="font-bold text-neutral-300">OpenRouter:</span> <span className={keyResults.openRouter?.status === 'ok' ? 'text-green-400 ml-2' : keyResults.openRouter?.status === 'missing' ? 'text-neutral-500 ml-2' : 'text-red-400 ml-2'}>{keyResults.openRouter?.message}</span>
                 </div>
              </div>
           </div>
        )}

        {/* Phase 1: Git Analyzer */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
           <h2 className="text-2xl font-bold mb-4">1. Extração do Git (Delta Sync)</h2>
           <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input type="text" placeholder="D:/caminho/repo" value={repoPath} onChange={e => setRepoPath(e.target.value)} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 placeholder-neutral-700" />
                <input type="text" placeholder="Git Author (ex: joserobson)" value={author} onChange={e => setAuthor(e.target.value)} className="w-full md:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 placeholder-neutral-700" />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800 gap-4">
                 <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={forceSync} onChange={e => setForceSync(e.target.checked)} className="w-5 h-5 text-orange-500 rounded border-neutral-700 bg-neutral-900" />
                    <span className="text-neutral-300 font-medium">Reanálise Forçada (Ignorar Cache)</span>
                 </label>
                 <button onClick={handleAnalyzeGit} disabled={loadingGit} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold">{loadingGit ? "Extraindo..." : "Analisar Repositório"}</button>
              </div>
           </div>
           {resultGit && <pre className="mt-4 p-4 text-xs font-mono bg-black rounded-lg">{JSON.stringify(resultGit, null, 2)}</pre>}
        </section>

        {/* Phase 2: Resume Input */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
           <h2 className="text-2xl font-bold mb-4">2. Dados Pessoais Base (PDF)</h2>
           <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                 <input type="text" placeholder="URL do GitHub" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 placeholder-neutral-700 text-sm" />
                 <input type="text" placeholder="URL do LinkedIn" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 placeholder-neutral-700 text-sm" />
              </div>
              <div className="flex gap-4 items-center">
                 <input type="file" onChange={e => setCvFile(e.target.files?.[0] || null)} className="flex-1 block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-orange-300" />
                 <button onClick={handleUploadCv} disabled={loadingCv || !cvFile} className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white font-bold">{loadingCv ? "Otimizando..." : "Absorver Currículo"}</button>
              </div>
           </div>
           {resultCv && <pre className="mt-4 p-4 text-xs font-mono bg-black rounded-lg text-orange-200">{JSON.stringify(resultCv, null, 2)}</pre>}
        </section>

        {/* LinkedIn Generation Section */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
           <h2 className="text-2xl font-bold mb-4 text-white">LinkedIn Maker + Otimizador</h2>
           <button onClick={handleGenerateLinkedin} disabled={loadingLi} className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold w-full mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/20 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
              <span className="relative">{loadingLi ? "Gerando Textos Impactantes..." : "Gerar Resumo para LinkedIn"}</span>
           </button>
           
           {resultLi && !resultLi.error && resultLi.data && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <RefinableBlock title="Seção Sobre Mim" type="about" initialText={resultLi.data.about} provider={provider} language={language} />
                  <div className="space-y-6">
                     <h3 className="text-xl font-bold border-b border-neutral-800 pb-2 text-white">Experiência nos Projetos</h3>
                     {resultLi.data.projects?.map((p: any, idx: number) => (
                        <RefinableBlock key={idx} title={p.name} type="project" id={p.id} initialText={p.text} provider={provider} language={language} />
                     ))}
                  </div>
              </div>
           )}
           {resultLi?.error && <p className="text-red-400 p-4 bg-red-900/20 rounded-lg border border-red-900/50">{resultLi.error}</p>}
        </section>

        {/* PDF / CV A4 Export */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
           <div className="flex flex-col gap-4">
             <div>
               <h2 className="text-2xl font-bold text-white">📄 Exportar Currículo (A4)</h2>
               <p className="text-neutral-400 text-sm mt-1">Abre o currículo formatado em layout A4 profissional. Use <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-xs">Ctrl+P</kbd> → <em>Salvar como PDF</em> no navegador.</p>
             </div>
             <div className="flex flex-col sm:flex-row gap-3">
               <a
                 href={`/cv?lang=${language}&github=${encodeURIComponent(githubUrl)}&linkedin=${encodeURIComponent(linkedinUrl)}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition-colors"
               >
                 📄 Abrir Currículo A4
               </a>
               <a
                 href={`/cv?lang=en&github=${encodeURIComponent(githubUrl)}&linkedin=${encodeURIComponent(linkedinUrl)}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold transition-colors border border-neutral-700"
               >
                 🌐 Open Resume (EN)
               </a>
             </div>
           </div>
        </section>

        {/* Phase 3: Platform Hacking */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Automação de Plataformas (Busca Ativa)
              </h2>
              <p className="text-neutral-400 text-sm">Digite o nome da plataforma (ex: Geekhunter, Gupy). A IA fará Mapeamento do site e preencherá com dados cruzados!</p>
              
              <div className="space-y-4">
                <input type="text" placeholder="Ex: GeekHunter" value={platformName} onChange={e => setPlatformName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 font-bold" />
                <div className="flex gap-4">
                  <button onClick={handleGeneratePlatformSchema} disabled={loadingPlatformMap || !platformName} className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg font-bold">{loadingPlatformMap ? "Lendo..." : "1. Mapear Plataforma"}</button>
                  <button onClick={handleFillPlatformData} disabled={loadingPlatformFill || !platformName} className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg font-bold">{loadingPlatformFill ? "Escrevendo..." : "2. Responder c/ Meu Perfil"}</button>
                </div>
              </div>

              {platformResult && (
                <div className="mt-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <h3 className="text-sm border-b border-neutral-800 pb-2 font-bold mb-2 text-orange-400">{platformResult.error ? "Erro" : platformResult.message || "Resultado:"}</h3>
                  {platformResult.schema ? (
                    <pre className="text-xs text-neutral-400 font-mono overflow-auto">{JSON.stringify(platformResult.schema, null, 2)}</pre>
                  ) : platformResult.data && !platformResult.error ? (
                    <div className="mt-4">
                      {(() => {
                        const sections: any[] = [];
                        const extractCampos = (node: any, pathName: string) => {
                          if (typeof node === 'object' && node !== null) {
                            if (Array.isArray(node.campos)) {
                              sections.push({ name: pathName, campos: node.campos });
                            } else {
                              Object.keys(node).forEach(key => extractCampos(node[key], key));
                            }
                          }
                        };
                        let targetNode = platformResult.data;
                        if (targetNode["perfil_geekhunter"] || targetNode[`perfil_${platformName.toLowerCase()}`]) {
                           targetNode = targetNode["perfil_geekhunter"] || targetNode[`perfil_${platformName.toLowerCase()}`] || targetNode;
                        }
                        extractCampos(targetNode, "Plataforma");

                        if (sections.length === 0) return <pre className="text-xs font-mono">{JSON.stringify(platformResult.data, null, 2)}</pre>;

                        return (
                          <div className="space-y-8">
                            {sections.map((sec, idx) => (
                              <div key={idx} className="space-y-4">
                                <h4 className="text-sm font-bold text-orange-400 capitalize">{sec.name.replace(/_/g, ' ')}</h4>
                                {sec.campos.map((c: any, cidx: number) => {
                                  const textVal = c.valor || c.sugestao || c.resposta || (typeof c.descricao === 'string' ? c.descricao : null);
                                  if (!textVal) return null;
                                  return <RefinableBlock key={cidx} title={c.campo} type="platform" id={null} initialText={String(textVal)} provider={provider} language={language} />;
                                })}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
        </section>

      </div>
    </main>
  );
}
