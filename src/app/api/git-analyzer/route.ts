import { NextResponse } from "next/server";
import { extractGitLogs, detectAuthor } from "@/lib/git";
import { analyzeProjectCommits, Provider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { repoPath, provider = 'gemini', forceSync = false } = body;
    let { author } = body;

    if (!repoPath) {
      return NextResponse.json({ error: "Caminho do repositório não informado." }, { status: 400 });
    }

    if (!author) {
      const detected = await detectAuthor(repoPath);
      if (!detected) {
        return NextResponse.json({ error: "Não foi possível detectar o autor do repositório. Informe o nome manualmente." }, { status: 400 });
      }
      author = detected.name || detected.email;
      console.log(`[Git Analyzer] Author auto-detected: ${author}`);
    }

    // Check if project exists to get lastAnalysedAt for Delta Sync
    const existingProject = await prisma.project.findUnique({
      where: { localPath: repoPath }
    });

    console.log(`Starting git log extraction for ${repoPath} (author: ${author}, forceSync: ${forceSync})`);
    
    const applyDeltaSync = !forceSync && existingProject?.lastAnalysedAt;
    const logs = await extractGitLogs(repoPath, author, 6, applyDeltaSync ? existingProject.lastAnalysedAt : null);
    
    if (!logs || logs.trim().length === 0) {
      return NextResponse.json({ upToDate: true, message: "Repositório atualizado — nenhum commit novo desde a última análise." });
    }

    console.log(`Extracted ${logs.length} bytes of log. Sending to AI (${provider})...`);

    // In a real scenario we'd limit 'logs' string size here.
    // E.g. logs = logs.substring(0, 50000);

    // Attempt to read README for context
    let readmeText = "";
    try {
      const readmePath = path.join(repoPath, "README.md");
      if (fs.existsSync(readmePath)) {
        readmeText = fs.readFileSync(readmePath, "utf-8").substring(0, 3000);
        console.log("README found and loaded as context.");
      }
    } catch (e) {
      console.log("No README found or could not read it.");
    }

    const summary = await analyzeProjectCommits(logs, readmeText, provider as Provider);

    let parsedSummary;
    try {
      // Trying to parse as JSON if the AI returned pure json. 
      const cleanJson = summary.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedSummary = JSON.parse(cleanJson);
    } catch {
      // If it fails to parse, return raw text
      parsedSummary = { raw: summary };
    }

    // Combine existing data with new data (Delta Merge) unless forceSync is true
    const newTechs = forceSync 
      ? parsedSummary.technologies || [] 
      : Array.from(new Set([...(existingProject?.technologies || []), ...(parsedSummary.technologies || [])]));
    
    const newChallenges = forceSync 
      ? parsedSummary.challenges || "" 
      : (existingProject?.challenges && parsedSummary.challenges
          ? `${existingProject.challenges}\n\n[Atualização Novas]:\n${parsedSummary.challenges}` 
          : parsedSummary.challenges || existingProject?.challenges || "");
          
    const newSolutions = forceSync 
      ? parsedSummary.solutions || "" 
      : (existingProject?.solutions && parsedSummary.solutions
          ? `${existingProject.solutions}\n\n[Atualização Novas]:\n${parsedSummary.solutions}` 
          : parsedSummary.solutions || existingProject?.solutions || "");
          
    const newDesc = forceSync ? (parsedSummary.projectDescription || "") : (parsedSummary.projectDescription || existingProject?.description || "");
    const newRole = forceSync ? (parsedSummary.developerRole || "") : (parsedSummary.developerRole || existingProject?.role || "");

    // Save to Database
    const repoName = repoPath.split(/[\/\\]/).filter(Boolean).pop() || "Unnamed Repo";
    await prisma.project.upsert({
      where: { localPath: repoPath },
      update: {
        technologies: newTechs,
        challenges: newChallenges,
        solutions: newSolutions,
        description: newDesc,
        role: newRole,
        lastAnalysedAt: new Date(),
      },
      create: {
        localPath: repoPath,
        name: repoName,
        technologies: parsedSummary.technologies || [],
        challenges: parsedSummary.challenges || "",
        solutions: parsedSummary.solutions || "",
        description: parsedSummary.projectDescription || "",
        role: parsedSummary.developerRole || "",
        lastAnalysedAt: new Date(),
      }
    });

    return NextResponse.json({
      message: "Análise salva com sucesso!",
      data: parsedSummary
    });

  } catch (error: any) {
    console.error("API Error in git-analyzer:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
