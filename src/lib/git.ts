import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type SamplingStrategy = 'full' | 'stat-only' | 'sampled';

interface RepoProbe {
  totalCommits: number;
  spanMonths: number;
  oldestDate: Date;
  newestDate: Date;
  strategy: SamplingStrategy;
}

async function probeRepo(repoPath: string, author: string): Promise<RepoProbe | null> {
  try {
    const { stdout } = await execAsync(
      `git log --author="${author}" --no-merges --format="%ai"`,
      { cwd: repoPath, maxBuffer: 1024 * 1024 * 2 }
    );

    const dates = stdout.trim().split('\n').filter(Boolean);
    if (dates.length === 0) return null;

    const newestDate = new Date(dates[0]);
    const oldestDate = new Date(dates[dates.length - 1]);
    const totalCommits = dates.length;
    const spanMonths = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    let strategy: SamplingStrategy;
    if (spanMonths <= 6 || totalCommits <= 60) {
      strategy = 'full';       // diffs completos
    } else if (spanMonths <= 24 || totalCommits <= 300) {
      strategy = 'stat-only';  // sem diffs, preserva mensagens e arquivos alterados
    } else {
      strategy = 'sampled';    // amostragem: primeiros + últimos commits
    }

    console.log(
      `[Git Probe] ${totalCommits} commits | ${spanMonths.toFixed(1)} months span | strategy: ${strategy}`
    );

    return { totalCommits, spanMonths, oldestDate, newestDate, strategy };
  } catch {
    return null;
  }
}

function buildHeader(probe: RepoProbe): string {
  return (
    `[ANÁLISE DO PROJETO]\n` +
    `- Total de commits do autor: ${probe.totalCommits}\n` +
    `- Período: ${probe.oldestDate.toLocaleDateString('pt-BR')} → ${probe.newestDate.toLocaleDateString('pt-BR')} (${probe.spanMonths.toFixed(0)} meses)\n` +
    `- Modo de extração: ${probe.strategy}\n\n`
  );
}

export async function extractGitLogs(
  repoPath: string,
  author: string,
  _months: number = 6,
  lastAnalysedAt?: Date | null
): Promise<string> {

  // Delta Sync: só o que mudou desde a última análise
  if (lastAnalysedAt) {
    const isoDate = lastAnalysedAt.toISOString();
    console.log(`[Git] Delta Sync — commits desde ${isoDate}`);
    try {
      const { stdout } = await execAsync(
        `git log --author="${author}" --since="${isoDate}" --no-merges --stat -p`,
        { cwd: repoPath, maxBuffer: 1024 * 1024 * 20 }
      );
      return stdout;
    } catch {
      return '';
    }
  }

  // Probe: descobre o tamanho real do projeto antes de ler tudo
  const probe = await probeRepo(repoPath, author);

  if (!probe) {
    console.warn('[Git] Probe falhou — nenhum commit encontrado para esse autor');
    return '';
  }

  const header = buildHeader(probe);
  const maxBuffer = 1024 * 1024 * 20;

  if (probe.strategy === 'full') {
    // Projeto pequeno ou recente: diffs completos
    const { stdout } = await execAsync(
      `git log --author="${author}" --no-merges --stat -p`,
      { cwd: repoPath, maxBuffer }
    );
    return header + stdout;
  }

  if (probe.strategy === 'stat-only') {
    // Projeto médio: stat sem diff, todos os commits
    const { stdout } = await execAsync(
      `git log --author="${author}" --no-merges --stat`,
      { cwd: repoPath, maxBuffer }
    );
    return header + stdout;
  }

  // Projeto grande/antigo: amostragem — últimos 80 + primeiros 20 commits
  // Os primeiros revelam o stack inicial; os últimos revelam o trabalho recente
  const [recentResult, oldestResult] = await Promise.all([
    execAsync(
      `git log --author="${author}" --no-merges --stat -n 80`,
      { cwd: repoPath, maxBuffer }
    ),
    execAsync(
      `git log --author="${author}" --no-merges --stat --reverse -n 20`,
      { cwd: repoPath, maxBuffer }
    ),
  ]);

  const combined =
    `=== COMMITS RECENTES (últimos 80) ===\n${recentResult.stdout}\n\n` +
    `=== COMMITS INICIAIS DO PROJETO (primeiros 20) ===\n${oldestResult.stdout}`;

  return header + combined;
}
