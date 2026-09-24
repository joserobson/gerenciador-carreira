#!/usr/bin/env node
/**
 * git-probe.js
 * Extrai histórico git com amostragem inteligente e contexto de projetos.
 * Sem dependências externas - utiliza apenas Node.js nativo.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runGit(cmd, cwd) {
  try {
    return execSync(cmd, {
      cwd,
      maxBuffer: 1024 * 1024 * 30, // 30MB buffer
      encoding: 'utf-8'
    }).trim();
  } catch (err) {
    return null;
  }
}

function detectAuthor(repoPath) {
  const name = runGit('git config user.name', repoPath);
  const email = runGit('git config user.email', repoPath);
  return { name: name || '', email: email || '' };
}

function probeRepo(repoPath, author) {
  const authorArg = author ? `--author="${author}"` : '';
  const countStr = runGit(`git rev-list ${authorArg} --no-merges --count HEAD`, repoPath);
  const totalCommits = parseInt(countStr || '0', 10);

  if (!totalCommits) {
    return null;
  }

  const newestDateStr = runGit(`git log ${authorArg} --no-merges --format="%ai" -1`, repoPath);
  const oldestDateStr = runGit(`git log ${authorArg} --no-merges --format="%ai" --reverse -1`, repoPath);

  const newestDate = newestDateStr ? new Date(newestDateStr) : new Date();
  const oldestDate = oldestDateStr ? new Date(oldestDateStr) : new Date();
  const spanMonths = Math.max(
    0.1,
    (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  let strategy = 'sampled';
  if (spanMonths <= 6 || totalCommits <= 60) {
    strategy = 'full';
  } else if (spanMonths <= 24 || totalCommits <= 300) {
    strategy = 'stat-only';
  }

  return { totalCommits, spanMonths, oldestDate, newestDate, strategy };
}

function getProjectContext(repoPath) {
  const context = {};

  // README
  const readmeFiles = ['README.md', 'readme.md', 'README.txt', 'README'];
  for (const f of readmeFiles) {
    const p = path.join(repoPath, f);
    if (fs.existsSync(p)) {
      try {
        context.readme = fs.readFileSync(p, 'utf-8').slice(0, 3500);
        break;
      } catch {}
    }
  }

  // package.json / requirements.txt / go.mod / pom.xml / Cargo.toml
  const manifestMap = [
    { file: 'package.json', type: 'node' },
    { file: 'requirements.txt', type: 'python' },
    { file: 'Pipfile', type: 'python' },
    { file: 'go.mod', type: 'go' },
    { file: 'pom.xml', type: 'java' },
    { file: 'Cargo.toml', type: 'rust' },
    { file: 'composer.json', type: 'php' },
    { file: 'mix.exs', type: 'elixir' }
  ];

  for (const item of manifestMap) {
    const p = path.join(repoPath, item.file);
    if (fs.existsSync(p)) {
      try {
        context.manifest = {
          file: item.file,
          type: item.type,
          content: fs.readFileSync(p, 'utf-8').slice(0, 2000)
        };
        break;
      } catch {}
    }
  }

  return context;
}

function extractLogs(repoPath, author, strategy) {
  const authorArg = author ? `--author="${author}"` : '';

  if (strategy === 'full') {
    // Diff completo de até 50 commits
    return runGit(`git log ${authorArg} --no-merges --stat -p -n 50`, repoPath) || '';
  }

  if (strategy === 'stat-only') {
    // Estatísticas de até 150 commits
    return runGit(`git log ${authorArg} --no-merges --stat -n 150`, repoPath) || '';
  }

  // Sampled: primeiros 15 + últimos 60 commits com estatísticas
  const recent = runGit(`git log ${authorArg} --no-merges --stat -n 60`, repoPath) || '';
  const oldest = runGit(`git log ${authorArg} --no-merges --stat --reverse -n 15`, repoPath) || '';

  return (
    `=== COMMITS RECENTES (últimos 60) ===\n${recent}\n\n` +
    `=== COMMITS INICIAIS DO PROJETO (primeiros 15) ===\n${oldest}`
  );
}

function main() {
  const args = process.argv.slice(2);
  let repoPath = process.cwd();
  let author = null;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' || args[i] === '-p') {
      repoPath = path.resolve(args[++i]);
    } else if (args[i] === '--author' || args[i] === '-a') {
      author = args[++i];
    } else if (args[i] === '--json') {
      jsonOutput = true;
    } else if (!args[i].startsWith('-') && i === 0) {
      repoPath = path.resolve(args[i]);
    }
  }

  // Verifica se é repo git
  const isGit = runGit('git rev-parse --is-inside-work-tree', repoPath);
  if (!isGit) {
    console.error(JSON.stringify({ error: `O diretório "${repoPath}" não é um repositório Git válido.` }));
    process.exit(1);
  }

  // Detecta autor se não especificado
  if (!author) {
    const detected = detectAuthor(repoPath);
    author = detected.name || detected.email || '';
  }

  const probe = probeRepo(repoPath, author);
  if (!probe) {
    // Tenta sem filtro de autor se não encontrou nada
    const probeAll = probeRepo(repoPath, '');
    if (!probeAll) {
      console.error(JSON.stringify({ error: `Nenhum commit encontrado no repositório.` }));
      process.exit(1);
    }
    author = ''; // usa todos
  }

  const activeProbe = probe || probeRepo(repoPath, '');
  const logs = extractLogs(repoPath, author, activeProbe.strategy);
  const context = getProjectContext(repoPath);

  const payload = {
    repoPath,
    repoName: path.basename(repoPath),
    author: author || 'Todos os contribuidores',
    probe: {
      totalCommits: activeProbe.totalCommits,
      spanMonths: parseFloat(activeProbe.spanMonths.toFixed(1)),
      oldestDate: activeProbe.oldestDate.toISOString().split('T')[0],
      newestDate: activeProbe.newestDate.toISOString().split('T')[0],
      strategy: activeProbe.strategy
    },
    context,
    logs
  };

  if (jsonOutput) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    // Formato de texto legível para o LLM
    console.log(`=== METADADOS DO REPOSITÓRIO ===`);
    console.log(`Projeto: ${payload.repoName}`);
    console.log(`Caminho: ${payload.repoPath}`);
    console.log(`Autor filtrado: ${payload.author}`);
    console.log(`Total de commits do autor: ${payload.probe.totalCommits}`);
    console.log(`Período: ${payload.probe.oldestDate} até ${payload.probe.newestDate} (~${payload.probe.spanMonths} meses)`);
    console.log(`Estratégia de extração: ${payload.probe.strategy}\n`);

    if (context.manifest) {
      console.log(`=== MANIFESTO DO PROJETO (${context.manifest.file}) ===`);
      console.log(context.manifest.content);
      console.log(`\n`);
    }

    if (context.readme) {
      console.log(`=== README DO PROJETO ===`);
      console.log(context.readme);
      console.log(`\n`);
    }

    console.log(`=== LOGS E DIFFS DO GIT ===`);
    console.log(logs);
  }
}

main();
