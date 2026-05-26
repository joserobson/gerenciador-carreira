import { askLocalAI, Provider } from "@/lib/ai";

export type ResumeTranslation = {
  user?: {
    title?: string;
    summary?: string;
  };
  projects?: Array<{
    id: string;
    jobTitle?: string;
    role?: string;
    challenges?: string;
    solutions?: string;
    startDate?: string;
    endDate?: string;
  }>;
  warnings?: string[];
};

function extractJsonObject(response: string) {
  const withoutFence = response.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return withoutFence.slice(start, end + 1);
}

function parseTranslation(response: string) {
  const jsonText = extractJsonObject(response);
  if (!jsonText) return null;

  try {
    return JSON.parse(jsonText) as ResumeTranslation;
  } catch {
    return null;
  }
}

function hasTranslatedContent(translation: ResumeTranslation | null) {
  if (!translation) return false;
  return Boolean(
    translation.user?.title ||
    translation.user?.summary ||
    translation.projects?.some((project) =>
      project.jobTitle ||
      project.role ||
      project.challenges ||
      project.solutions ||
      project.startDate ||
      project.endDate
    )
  );
}

async function translateStructured(user: any, projects: any[], provider: Provider) {
  const prompt = `You are translating a technical resume from Portuguese (Brazil) to English (US).
Return ONLY one valid JSON object. No markdown. No comments. No explanations.

JSON shape:
{
  "user": { "title": "string", "summary": "string" },
  "projects": [
    { "id": "string", "jobTitle": "string", "role": "string", "challenges": "string", "solutions": "string", "startDate": "string", "endDate": "string" }
  ]
}

Rules:
- Preserve IDs exactly.
- Preserve names, company names, URLs, emails, programming languages, frameworks, libraries, acronyms, and product names.
- Translate professional titles, summaries, dates written as words, challenges, actions, and results.
- If a field is empty, return an empty string.
- Keep the same meaning. Do not invent experience, metrics, technologies, or employers.

Input JSON:
${JSON.stringify({
  user: {
    title: user.title || "",
    summary: user.summary || "",
  },
  projects: projects.map((project) => ({
    id: project.id,
    jobTitle: project.jobTitle || "",
    role: project.role || "",
    challenges: project.challenges || "",
    solutions: project.includeResultsInResume === false ? "" : project.solutions || "",
    startDate: project.startDate || "",
    endDate: project.endDate || "",
  })),
})}`;

  const providers: Provider[] = provider === "gemini" ? ["gemini", "claude"] : ["claude", "gemini"];
  const warnings: string[] = [];

  for (const currentProvider of providers) {
    try {
      const response = await askLocalAI(prompt, currentProvider, "light");
      const translation = parseTranslation(response);
      if (hasTranslatedContent(translation)) {
        return { ...translation, warnings };
      }
      warnings.push(`${currentProvider}: retorno sem JSON valido`);
    } catch (error: any) {
      warnings.push(`${currentProvider}: ${error?.message || "falha desconhecida"}`);
    }
  }

  throw new Error(`Não foi possível traduzir o currículo. ${warnings.join(" | ")}`);
}

export async function translateResumeForDisplay(user: any, projects: any[], provider: Provider) {
  return translateStructured(user, projects, provider);
}
