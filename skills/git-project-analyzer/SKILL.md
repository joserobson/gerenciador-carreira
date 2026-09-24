---
name: git-project-analyzer
description: Analisa repositórios Git locais, histórico de commits, tecnologias e desafios técnicos para gerar relatórios de senioridade, formato STAR e bullet points de impacto para currículos e portfólio.
---

# Git & Project Analyzer Skill

Esta skill permite ao agente analisar um repositório Git local e extrair automaticamente dados estruturados para o perfil de carreira do desenvolvedor.

## 🎯 Quando Usar

- Quando o usuário pedir para **analisar um repositório Git**, pasta de código ou projeto.
- Quando o usuário quiser extrair **tecnologias, desafios, soluções e senioridade** com base no que ele realmente desenvolveu.
- Quando o usuário quiser gerar **bullet points de currículo (STAR)** baseados no histórico de commits.

---

## 🛠️ Procedimento de Execução

### Passo 1: Coletar os dados do repositório

Execute o script utilitário `git-probe.js` passando o caminho do repositório:

```bash
node skills/git-project-analyzer/scripts/git-probe.js --path "<CAMINHO_DO_REPOSITORIO>"
```

*(Opcional)* Se o usuário quiser filtrar por um autor específico:
```bash
node skills/git-project-analyzer/scripts/git-probe.js --path "<CAMINHO_DO_REPOSITORIO>" --author "<NOME_OU_EMAIL>"
```

> Se nenhum caminho for informado, o script analisa o diretório atual do workspace.

---

### Passo 2: Analisar os logs e manifesto

Ao ler o retorno do script, examine:
1. **Manifesto do projeto** (`package.json`, `requirements.txt`, etc.): Identifique as versões e ecossistema de bibliotecas e ferramentas.
2. **README do projeto**: Compreenda o propósito de negócio do software.
3. **Estatísticas e Diffs do Git**:
   - Quais módulos o desenvolvedor criou ou refatorou?
   - Ele mexeu em infraestrutura, arquitetura, queries de banco, segurança, pipelines ou apenas telas?
   - Quais problemas complexos/bugs críticos foram corrigidos?

---

### Passo 3: Sintetizar a Análise (Padrão STAR & ATS)

Produza a saída contendo:

1. **Cargo/Senioridade Inferida**:
   - *Exemplo*: "Senior Fullstack Engineer (React / Node.js)", "Frontend Specialist (Performance & Design Systems)".
2. **Resumo do Projeto**: 2-3 linhas sobre o produto e impacto.
3. **Tecnologias Identificadas**: Lista de frameworks, libs, bancos, ferramentas com relevância comprovada nos commits.
4. **Destaques STAR (Situação, Tarefa, Ação, Resultado)**:
   - **Desafio (Challenge)**: Problema técnico, gargalo, débitos ou requisitos complexos.
   - **Ação (Action)**: Como o desenvolvedor resolveu arquiteturalmente ou através de código.
   - **Resultado (Result)**: Impacto obtido (estabilidade, performance, redução de débito técnico, escalabilidade).
5. **Bullet Points Prontos para Currículo**:
   - Frases ativas em primeira pessoa (ex: *"Arquitetei...", "Implementei...", "Reduzi o tempo de..."*).

---

## 📋 Formato de Resposta Obrigatório

Apresente o resultado em **Markdown legível** para o usuário e, ao final, inclua o bloco de código **JSON puro** compatível com o schema abaixo:

```json
{
  "projectName": "nome-do-projeto",
  "period": {
    "start": "YYYY-MM",
    "end": "YYYY-MM",
    "totalCommits": 0
  },
  "inferredRole": "Cargo e Nível inferido",
  "projectSummary": "Resumo objetivo do projeto...",
  "technologies": ["Tech 1", "Tech 2", "Tech 3"],
  "starHighlights": [
    {
      "challenge": "Descrição do desafio técnico...",
      "action": "O que foi feito tecnicamente...",
      "result": "Impacto gerado..."
    }
  ],
  "bulletPointsCV": [
    "Ação de impacto com verbo forte...",
    "Outra entrega relevante..."
  ]
}
```
