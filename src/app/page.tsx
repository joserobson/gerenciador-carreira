"use client";

import { useState, useEffect } from "react";

function RefinableBlock({ title, type, id, fieldPath, initialText, provider, language, onSave }: any) {
  const [text, setText] = useState(initialText);
  const [prompt, setPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleRefine = async () => {
    if (!prompt.trim()) return;
    setIsRefining(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, fieldPath, originalText: text, userPrompt: prompt, provider, language })
      });
      const data = await res.json();
      if (!data.error && data.data) {
        setText(data.data);
        setPrompt("");
        setIsEditMode(false);
        if (onSave) onSave(data.data);
      } else {
        alert(data.error || "Erro ao refinar");
      }
    } catch (e: any) {
      alert("Erro fatal ao conectar IA");
    } finally {
      setIsRefining(false);
    }
  };

  const handleBlur = () => {
    setIsManualEdit(false);
    if (onSave && text !== initialText) {
      onSave(text);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 shadow-lg space-y-4">
      <div className="flex justify-between items-center mb-2">
         <h3 className="font-bold text-orange-400 capitalize">{title}</h3>
         <div className="flex gap-2">
            <button onClick={() => setIsManualEdit(!isManualEdit)} className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 px-2 py-1 rounded transition-colors">
               {isManualEdit ? "💾 Pronto" : "✏️ Editar"}
            </button>
            <button onClick={() => setIsEditMode(!isEditMode)} className="text-xs bg-neutral-800 hover:bg-neutral-700 text-orange-300 px-3 py-1 rounded-full transition-colors flex items-center gap-1">
                ✨ Refinar c/ IA
            </button>
         </div>
      </div>

      {isManualEdit ? (
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-sm text-neutral-200 min-h-[100px] outline-none focus:border-orange-500/50"
        />
      ) : (
        <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">{text}</p>
      )}

      {isEditMode && (
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-3 bg-neutral-950 p-3 rounded-md animate-in fade-in duration-300">
           <label className="text-xs font-semibold text-neutral-400">Dica de Refinamento (Ex: "Deixe mais formal")</label>
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

function JsonModal({ isOpen, onClose, title, data }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden scale-in-center">
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
           <h3 className="text-xl font-bold text-orange-400 capitalize">{title}</h3>
           <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-black/40">
           <pre className="text-xs font-mono text-neutral-400 leading-relaxed">
             {JSON.stringify(data, null, 2)}
           </pre>
        </div>
        <div className="p-4 border-t border-neutral-800 flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold">Fechar</button>
        </div>
      </div>
    </div>
  );
}

function EditableInput({ label, value, onBlur, placeholder, className = "" }: any) {
  const [val, setVal] = useState(value);
  
  useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
      <input 
        type="text"
        value={val || ""}
        onChange={e => setVal(e.target.value)}
        onBlur={() => onBlur(val)}
        placeholder={placeholder}
        className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-200 focus:border-orange-500/50 outline-none transition-colors"
      />
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

  // States - Versions
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Initial Load
  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        setResultCv({ message: "Dados carregados do banco", data: data.profile });
        // Set URLs if found
        if (data.profile.portfolio) setGithubUrl(data.profile.portfolio);
      }
      if (data.projects && data.projects.length > 0) {
        setResultGit({ message: "Projetos carregados do banco", data: data.projects });
      }
    } catch (e) {
      console.error("Erro ao carregar dados iniciais:", e);
    }
  };

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch("/api/versions");
      const data = await res.json();
      if (!data.error) setVersions(data);
    } catch (e) {
      console.error("Erro ao carregar versões:", e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleCreateSnapshot = async (autoName?: string) => {
    try {
      await fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: autoName })
      });
      fetchVersions();
    } catch (e) {
      console.error("Erro ao criar snapshot:", e);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm("Isso irá substituir seus dados atuais pela versão selecionada. Continuar?")) return;
    try {
      const res = await fetch("/api/versions/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId })
      });
      const data = await res.json();
      if (!data.error) {
        alert(data.message);
        window.location.reload(); // Simplest way to re-fertilize all state
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Erro ao restaurar versão");
    }
  };

  // States - Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  const [modalTitle, setModalTitle] = useState("");

  const openModal = (title: string, content: any) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const handleUpdateProfile = async (field: string, value: any) => {
    try {
      await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value })
      });
      // Refresh local state if it's a critical field
      if (field === 'summary') setResultCv(prev => ({ ...prev, data: { ...prev.data, summary: value } }));
    } catch (e) { console.error("Update error:", e); }
  };

  const handleUpdateProject = async (projectId: string, field: string, value: any) => {
    try {
      await fetch("/api/projects/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, [field]: value })
      });
    } catch (e) { console.error("Update Project error:", e); }
  };

  useEffect(() => {
    fetchInitialData();
    fetchVersions();
  }, []);

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
    if (!repoPath.trim()) return;

    // Warning if project already has data
    if (resultGit?.data && forceSync) {
       const confirm = window.confirm("A re-análise forçada irá sobrescrever as descrições e resoluções atuais dete projeto. Deseja criar um Snapshot de segurança e continuar?");
       if (!confirm) return;
       await handleCreateSnapshot(`Snapshot Git - ${repoPath.split(/[\/\\]/).pop()}`);
    }

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

    // Warning logic
    if (resultCv?.data) {
       const confirm = window.confirm("Você já possui dados de currículo salvos. O novo upload irá sobrescrever suas alterações e refinamentos. Deseja criar um Snapshot de segurança e continuar?");
       if (!confirm) return;
       await handleCreateSnapshot(`Snapshot Automático - ${new Date().toLocaleDateString()}`);
    }

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

        {/* Snapshot Management */}
        <section id="versions" className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 shadow-xl pt-24 -mt-16">
           <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">🕒 Gerenciador de Versões</h2>
                <p className="text-neutral-500 text-xs mt-1">Sua jornada de evolução é sagrada. Salve snapshots para testar novas abordagens.</p>
              </div>
              <button 
                onClick={() => handleCreateSnapshot()}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold border border-neutral-700 transition-all flex items-center gap-2"
              >
                📸 Criar Snapshot Manual
              </button>
           </div>

           {versions.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {versions.map((v) => (
                 <div key={v.id} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex justify-between items-center group hover:border-orange-500/50 transition-colors">
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-neutral-200">{v.name}</span>
                       <span className="text-[10px] text-neutral-500">{new Date(v.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <button 
                      onClick={() => handleRestoreVersion(v.id)}
                      className="text-[10px] bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white px-3 py-1.5 rounded-lg border border-orange-600/20 transition-all"
                    >
                      Restaurar
                    </button>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-8 border-2 border-dashed border-neutral-800 rounded-xl">
                <p className="text-neutral-600 text-sm italic">Nenhuma versão salva ainda. Snapshots são criados automaticamente antes de grandes mudanças.</p>
             </div>
           )}
        </section>

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
        <section id="git" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl pt-24 -mt-12">
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
                  <button onClick={handleAnalyzeGit} disabled={loadingGit} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {loadingGit ? "Extraindo..." : "Analisar Repositório"}
                  </button>
               </div>
            </div>
            
            {resultGit && (
              <div className="mt-6 animate-in slide-in-from-top-2 duration-500">
                 {resultGit.error ? (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{resultGit.error}</div>
                 ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-neutral-950 p-4 rounded-xl border border-neutral-800 gap-4">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                             <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          </div>
                          <div>
                             <h3 className="font-bold text-neutral-200">{resultGit.message || "Análise Concluída"}</h3>
                             <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                                {resultGit.data?.name || repoPath.split(/[\/\\]/).pop()} • {resultGit.data?.technologies?.length || 0} Techs Encontradas
                             </p>
                          </div>
                       </div>
                       <button 
                         onClick={() => openModal("Logs do Robô - Git Analyzer", resultGit)}
                         className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold border border-neutral-700 transition-colors"
                       >
                         🔍 Ver Logs Técnicos (JSON)
                       </button>
                    </div>
                 )}
              </div>
            )}
        </section>

        {/* Phase 2: Master Curriculum Editor */}
        <section id="master" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden pt-24 -mt-12">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <svg className="w-24 h-24 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-4 4 4h-3v4h-2zm3.25-10.25L12 4.13l-2.25 2.62H14.25z"/></svg>
           </div>
           
           <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-orange-500">2.</span> Currículo Mestre (SSOT)
           </h2>
           <p className="text-neutral-400 text-sm mb-6">Estes dados são a base para Tudo. Alterações aqui refletem no CV, LinkedIn e todas as plataformas.</p>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Details */}
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-2">Perfil do Candidato</h3>
                    <EditableInput label="Nome Completo" value={resultCv?.data?.name} onBlur={(v: string) => handleUpdateProfile('name', v)} />
                    <EditableInput label="Título Profissional" value={resultCv?.data?.title} onBlur={(v: string) => handleUpdateProfile('title', v)} />
                    <EditableInput label="E-mail" value={resultCv?.data?.email} onBlur={(v: string) => handleUpdateProfile('email', v)} />
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Habilidades (Separadas por vírgula)</label>
                      <textarea 
                        value={resultCv?.data?.skills?.join(", ")}
                        onBlur={(e) => handleUpdateProfile('skills', e.target.value.split(",").map(s => s.trim()))}
                        className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-200 h-24 focus:border-orange-500/50 outline-none"
                      />
                    </div>
                 </div>

                 <div className="bg-neutral-800/20 p-4 rounded-xl border border-neutral-800 space-y-4">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase">PDF & URLs Base</h3>
                    <div className="flex flex-col gap-3">
                       <input type="file" onChange={e => setCvFile(e.target.files?.[0] || null)} className="block w-full text-[10px] text-neutral-400 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-neutral-800 file:text-orange-300" />
                       <button onClick={handleUploadCv} disabled={loadingCv || !cvFile} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-xs font-bold transition-all">
                          {loadingCv ? "Otimizando..." : "🔄 Atualizar por Novo PDF"}
                       </button>
                    </div>
                    <EditableInput label="GitHub URL" value={githubUrl} onBlur={(v: string) => { setGithubUrl(v); handleUpdateProfile('portfolio', v); }} />
                    <EditableInput label="LinkedIn URL" value={linkedinUrl} onBlur={(v: string) => setLinkedinUrl(v)} />
                 </div>
              </div>

              {/* Summary and Projects */}
              <div className="lg:col-span-2 space-y-8">
                 {resultCv && (
                   <div className="space-y-4">
                      {resultCv.error ? (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{resultCv.error}</div>
                      ) : resultCv.data && (
                        <div>
                           <div className="flex justify-between items-center mb-2 px-1">
                              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Cérebro do Currículo</span>
                              <button onClick={() => openModal("Extração - Raw JSON", resultCv)} className="text-[10px] text-neutral-500 hover:text-orange-400">Ver JSON Original</button>
                           </div>
                           <RefinableBlock 
                             title="Resumo Profissional" 
                             type="about" 
                             initialText={resultCv.data.summary} 
                             provider={provider} 
                             language={language} 
                             onSave={(v: string) => handleUpdateProfile('summary', v)}
                           />
                        </div>
                      )}
                   </div>
                 )}

                 <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center justify-between">
                       <span>Projetos e Experiência</span>
                       <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-1 rounded border border-sky-500/20">Fonte: Git + Refinamento</span>
                    </h3>
                    
                    {resultGit?.data?.length > 0 ? (
                      <div className="space-y-10">
                        {resultGit.data.map((p: any) => (
                          <div key={p.id} className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6 space-y-6 hover:bg-neutral-900/50 transition-all">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <EditableInput label="Nome do Projeto" value={p.name} onBlur={(v: string) => handleUpdateProject(p.id, 'name', v)} />
                                <EditableInput label="Empresa" value={p.company} onBlur={(v: string) => handleUpdateProject(p.id, 'company', v)} placeholder="Ex: Google" />
                                <EditableInput label="Cargo/Papel" value={p.role} onBlur={(v: string) => handleUpdateProject(p.id, 'role', v)} />
                                <div className="grid grid-cols-2 gap-2">
                                  <EditableInput label="Início" value={p.startDate} onBlur={(v: string) => handleUpdateProject(p.id, 'startDate', v)} placeholder="Jan/20" />
                                  <EditableInput label="Fim" value={p.endDate} onBlur={(v: string) => handleUpdateProject(p.id, 'endDate', v)} placeholder="Atual" />
                                </div>
                             </div>

                             <div className="space-y-4">
                               <RefinableBlock 
                                 title="Contexto e Desafios" 
                                 type="project" id={p.id} fieldPath="challenges" 
                                 initialText={p.challenges} provider={provider} language={language} 
                                 onSave={(v: string) => handleUpdateProject(p.id, 'challenges', v)}
                               />
                               <RefinableBlock 
                                 title="Ações e Resultados (STAR)" 
                                 type="project" id={p.id} fieldPath="solutions" 
                                 initialText={p.solutions} provider={provider} language={language} 
                                 onSave={(v: string) => handleUpdateProject(p.id, 'solutions', v)}
                               />
                             </div>

                             <EditableInput label="Tecnologias (Vírgula)" value={p.technologies?.join(", ")} onBlur={(v: string) => handleUpdateProject(p.id, 'technologies', v.split(",").map(t => t.trim()))} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-neutral-950 border border-neutral-800 rounded-2xl border-dashed">
                         <p className="text-neutral-500 text-sm">Nenhum projeto indexado. Comece analisando um repositório Git acima!</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </section>

        {/* Phase 3: LinkedIn Maker */}
        <section id="linkedin" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl pt-24 -mt-12">
           <h2 className="text-2xl font-bold mb-4 text-white">3. LinkedIn Maker + Otimizador</h2>
           <button onClick={handleGenerateLinkedin} disabled={loadingLi} className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold w-full mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/20 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
              <span className="relative">{loadingLi ? "Gerando Textos Impactantes..." : "Gerar Resumo para LinkedIn (Baseado no Mestre)"}</span>
           </button>
           
           {resultLi && !resultLi.error && resultLi.data && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <RefinableBlock title="Seção Sobre Mim (Tailored)" type="about" initialText={resultLi.data.about} provider={provider} language={language} />
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

        {/* Phase 4: Platform Hacking */}
        <section id="platforms" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl pt-24 -mt-12 relative overflow-hidden group">
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
                         const renderPlatformNode = (node: any, path: string = ""): any => {
                           if (node === null || node === undefined) return null;

                           // Caso especial: Campo terminal (Texto ou Número) -> Renderiza Bloco Refinável
                           if (typeof node === "string" || typeof node === "number") {
                             const title = path.split(".").pop()?.replace(/_/g, " ") || "Campo";
                             return (
                               <RefinableBlock 
                                 key={path}
                                 title={title}
                                 type="platform"
                                 id={platformResult.platformDataId}
                                 fieldPath={path}
                                 initialText={String(node)}
                                 provider={provider}
                                 language={language}
                               />
                             );
                           }

                           // Caso: Array (ex: Experiências)
                           if (Array.isArray(node)) {
                             return (
                               <div className="space-y-6 pl-4 border-l border-neutral-800 ml-2" key={path}>
                                 {node.map((item, idx) => (
                                   <div key={`${path}.${idx}`} className="space-y-4">
                                     <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest bg-neutral-900 w-fit px-2 py-0.5 rounded">ITEM {idx + 1}</div>
                                     {renderPlatformNode(item, `${path}.${idx}`)}
                                   </div>
                                 ))}
                               </div>
                             );
                           }

                           // Caso: Objeto (Sessão)
                           if (typeof node === "object") {
                             // Se tiver a chave 'campos' (legado), tratamos de forma especial
                             if (node.campos && Array.isArray(node.campos)) {
                                return (
                                  <div className="space-y-4" key={path}>
                                    {node.campos.map((c: any, idx: number) => {
                                       const val = c.valor || c.sugestao || c.resposta;
                                       if (!val) return null;
                                       return renderPlatformNode(val, `${path}.campos.${idx}.${c.valor ? 'valor' : c.sugestao ? 'sugestao' : 'resposta'}`);
                                    })}
                                  </div>
                                );
                             }

                             return (
                               <div className="space-y-6" key={path}>
                                 {Object.entries(node).map(([key, value]) => {
                                   const readableKey = key.replace(/_/g, " ");
                                   // Se for um objeto aninhado, renderizamos como uma sub-sessão com título
                                   if (typeof value === "object" && value !== null) {
                                     return (
                                       <div key={key} className="space-y-4 pt-4 first:pt-0">
                                         <h4 className="text-sm font-bold text-orange-400 capitalize flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                            {readableKey}
                                         </h4>
                                         <div className="space-y-4">
                                           {renderPlatformNode(value, path ? `${path}.${key}` : key)}
                                         </div>
                                       </div>
                                     );
                                   }
                                   // Valor terminal simples
                                   return renderPlatformNode(value, path ? `${path}.${key}` : key);
                                 })}
                               </div>
                             );
                           }
                         };

                         const targetNode = platformResult.data;
                         return (
                           <div className="mt-4 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             {renderPlatformNode(targetNode)}
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

      <JsonModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalTitle} 
        data={modalContent} 
      />
    </main>
  );
}
