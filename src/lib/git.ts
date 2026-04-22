import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function detectAuthor(repoPath: string): Promise<{ name: string; email: string } | null> {
  try {
    const [nameResult, emailResult] = await Promise.all([
      execAsync('git config user.name', { cwd: repoPath, maxBuffer: 1024 * 512 }),
      execAsync('git config user.email', { cwd: repoPath, maxBuffer: 1024 * 512 }),
    ]);
    const name = nameResult.stdout.trim();
    const email = emailResult.stdout.trim();
    if (!name && !email) return null;
    console.log(`[Git] Author detected: ${name} <${email}>`);
    return { name, email };
  } catch {
    return null;
  }
}

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
    // git --author accepts partial match against "Name <email>", so passing name OR email works
    const [countResult, newestResult, oldestResult] = await Promise.all([
      execAsync(`git rev-list --author="${author}" --no-merges --count HEAD`, { cwd: repoPath, maxBuffer: 1024 * 512 }),
      execAsync(`git log --author="${author}" --no-merges --format="%ai" -1`, { cwd: repoPath, maxBuffer: 1024 * 512 }),
      execAsync(`git log --author="${author}" --no-merges --format="%ai" --reverse -1`, { cwd: repoPath, maxBuffer: 1024 * 512 }),
    ]);

    const totalCommits = parseInt(countResult.stdout.trim(), 10);
    if (!totalCommits) return null;

    const newestDate = new Date(newestResult.stdout.trim());
    const oldestDate = new Date(oldestResult.stdout.trim());
    const spanMonths = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    let strategy: SamplingStrategy;
    if (spanMonths <= 6 || totalCommits <= 60) {
      strategy = 'full';
    } else if (spanMonths <= 24 || totalCommits <= 300) {
      strategy = 'stat-only';
    } else {
      strategy = 'sampled';
    }

    console.log(`[Git Probe] ${totalCommits} commits | ${spanMonths.toFixed(1)} months | strategy: ${strategy}`);

    return { totalCommits, spanMonths, oldestDate, newestDate, strategy };
  } catch (e) {
    console.warn('[Git Probe] failed:', e);
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
        `git log --author="${author}" --since="${isoDate}" --no-merges --stat -p -n 60`,
        { cwd: repoPath, maxBuffer: 1024 * 1024 * 15 }
      );
      return stdout;
    } catch {
      return '';
    }
  }

  const probe = await probeRepo(repoPath, author);

  if (!probe) {
    throw new Error(
      `Nenhum commit encontrado para o autor "${author}" em "${repoPath}". ` +
      `Verifique se o caminho está correto e se o nome do autor bate com o git log do repositório.`
    );
  }

  const header = buildHeader(probe);

  if (probe.strategy === 'full') {
    // Projeto pequeno/recente: diffs completos, cap 50 commits
    const { stdout } = await execAsync(
      `git log --author="${author}" --no-merges --stat -p -n 50`,
      { cwd: repoPath, maxBuffer: 1024 * 1024 * 20 }
    );
    return header + stdout;
  }

  if (probe.strategy === 'stat-only') {
    // Projeto médio: sem diffs, cap 150 commits
    const { stdout } = await execAsync(
      `git log --author="${author}" --no-merges --stat -n 150`,
      { cwd: repoPath, maxBuffer: 1024 * 1024 * 10 }
    );
    return header + stdout;
  }

  // Projeto grande/antigo: últimos 60 + primeiros 15 commits
  const [recentResult, oldestResult] = await Promise.all([
    execAsync(
      `git log --author="${author}" --no-merges --stat -n 60`,
      { cwd: repoPath, maxBuffer: 1024 * 1024 * 8 }
    ),
    execAsync(
      `git log --author="${author}" --no-merges --stat --reverse -n 15`,
      { cwd: repoPath, maxBuffer: 1024 * 1024 * 4 }
    ),
  ]);

  const combined =
    `=== COMMITS RECENTES (últimos 60) ===\n${recentResult.stdout}\n\n` +
    `=== COMMITS INICIAIS DO PROJETO (primeiros 15) ===\n${oldestResult.stdout}`;

  return header + combined;
}
