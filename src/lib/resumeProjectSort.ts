type ResumeProject = {
  createdAt?: Date | string | null;
  startDate?: string | null;
  endDate?: string | null;
  resumeOrder?: number | null;
};

const monthMap: Record<string, number> = {
  jan: 0,
  janeiro: 0,
  feb: 1,
  fev: 1,
  fevereiro: 1,
  mar: 2,
  marco: 2,
  março: 2,
  apr: 3,
  abr: 3,
  abril: 3,
  may: 4,
  mai: 4,
  maio: 4,
  jun: 5,
  junho: 5,
  jul: 6,
  julho: 6,
  aug: 7,
  ago: 7,
  agosto: 7,
  sep: 8,
  set: 8,
  setembro: 8,
  oct: 9,
  out: 9,
  outubro: 9,
  nov: 10,
  novembro: 10,
  dec: 11,
  dez: 11,
  dezembro: 11,
};

function normalizeDateText(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isOpenProject(project: ResumeProject) {
  const endDate = normalizeDateText(project.endDate);
  return !endDate || ["atual", "present", "current", "hoje", "ongoing", "em andamento"].some((token) => endDate.includes(token));
}

function parseLooseDate(value?: string | null) {
  const normalized = normalizeDateText(value);
  if (!normalized) return 0;

  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return 0;

  const year = Number(yearMatch[0]);
  const monthKey = Object.keys(monthMap).find((month) => normalized.includes(month));
  const month = monthKey ? monthMap[monthKey] : 11;

  return new Date(year, month, 1).getTime();
}

function createdAtTime(project: ResumeProject) {
  if (!project.createdAt) return 0;
  const date = project.createdAt instanceof Date ? project.createdAt : new Date(project.createdAt);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function sortResumeProjects<T extends ResumeProject>(projects: T[]) {
  return [...projects].sort((a, b) => {
    const aManual = typeof a.resumeOrder === "number";
    const bManual = typeof b.resumeOrder === "number";

    if (aManual || bManual) {
      if (!aManual) return 1;
      if (!bManual) return -1;
      if (a.resumeOrder !== b.resumeOrder) return (a.resumeOrder as number) - (b.resumeOrder as number);
    }

    const aOpen = isOpenProject(a);
    const bOpen = isOpenProject(b);
    if (aOpen !== bOpen) return aOpen ? -1 : 1;

    const aEnd = parseLooseDate(a.endDate);
    const bEnd = parseLooseDate(b.endDate);
    if (aEnd !== bEnd) return bEnd - aEnd;

    const aStart = parseLooseDate(a.startDate);
    const bStart = parseLooseDate(b.startDate);
    if (aStart !== bStart) return bStart - aStart;

    return createdAtTime(b) - createdAtTime(a);
  });
}
