# Roadmap — Gerenciador de Carreira

> Atualize este arquivo sempre que completar ou iniciar algo. Ele é a fonte de verdade do estado do projeto.
> Status: `[x]` = feito | `[-]` = parcial/com pendência | `[ ]` = não iniciado

---

## Módulo 1 — Infraestrutura

- [x] Next.js app scaffold (App Router)
- [x] Prisma + PostgreSQL (docker-compose)
- [x] Inicialização para Codex com instruções do agente e fluxo `#commit`
- [x] AI Load Balancer híbrido (Cerebras → Groq → OpenRouter → Claude → Gemini)
- [x] Endpoint `/api/test-keys` para validar chaves configuradas
- [x] Endpoint `/api/refine` — refinamento de texto via IA (usado por RefinableBlock)

---

## Módulo 2 — Ingestão de Dados

- [x] Upload de PDF de currículo → extração estruturada via IA → salva em `UserProfile`
- [x] Git Analyzer: extração inteligente com probe automático de range (oldest→newest commit)
  - `full` (≤6 meses ou ≤60 commits): diffs completos, cap 50 commits
  - `stat-only` (≤24 meses ou ≤300 commits): arquivos alterados sem diff, cap 150 commits
  - `sampled` (projetos antigos/grandes): últimos 60 + primeiros 15 commits
- [x] Auto-detecção de autor via `git config user.name` / `user.email` ao informar o caminho do repo
  - Campo autor preenchido automaticamente no blur do campo de caminho
  - Rota detecta automaticamente se o campo vier vazio
  - Erro explicativo quando autor não é encontrado (em vez de falha silenciosa)
- [x] Delta Sync: re-análise forçada só sobrescreve se o usuário confirmar
- [x] Projetos analisados recarregados corretamente na seção Currículo Mestre após análise
- [x] Projetos e Experiência em acordeão retraído (expande ao clicar)
- [x] Edição de campos do projeto persiste no estado React e salva no banco (estado local atualizado imediatamente)
- [x] Campos de data (Início/Fim) com largura correta para digitar o ano completo
- [ ] Análise de URL de portfólio (campo existe no form, mas não há análise automatizada do conteúdo)
- [ ] Importação em lote de múltiplos repositórios git de uma vez

---

## Módulo 3 — Currículo Mestre (SSOT)

- [x] Editor inline de perfil (nome, título, email, skills, GitHub, LinkedIn, site profissional)
- [x] Auto-save no blur (sem botão de salvar)
- [x] RefinableBlock: edição manual + refinamento por IA em qualquer campo de texto
- [x] Seção de projetos/experiência com campos: nome, empresa, cargo, datas, techs, desafios, ações
- [x] Controle por projeto para incluir/excluir do currículo
- [x] Controle por projeto e em lote para incluir/excluir ações e resultados no currículo
- [x] Ordenação híbrida dos projetos no currículo (ordem manual opcional + abertos primeiro + datas decrescentes)
- [-] Educação e certificações — **não há modelo nem UI para isso ainda**
- [-] Idiomas — **não há modelo nem UI para isso ainda**

---

## Módulo 4 — Saídas / Exportação

- [x] Currículo A4 em `/cv` com suporte PT-BR e EN-US
- [x] Gerador de "Sobre Mim" para LinkedIn
- [x] Tradução assíncrona do currículo em inglês com progresso, aviso de erro e parser robusto de JSON da IA
- [x] Exportação direta para PDF limpo via Puppeteer sem cabeçalho/rodapé/URL/data do navegador
- [ ] Portfólio web gerado automaticamente (página pública)

---

## Módulo 5 — Plataformas de Recrutamento

- [x] Mapeador de plataforma: IA gera schema de campos de qualquer plataforma (ex: GeekHunter)
- [x] Preenchedor: cruza perfil SSOT com schema e retorna dados prontos
- [x] Schema de exemplo para GeekHunter em `docs/`
- [-] Dados gerados exibidos com RefinableBlock, mas **não persistem edições por campo** (falta `save` no render recursivo)
- [ ] Adição de novas plataformas pela UI (hoje é por texto livre, sem persistência de schema entre sessões)
- [ ] Automação de formulário via browser (preenchimento automático real)

---

## Módulo 6 — Versionamento / Histórico

- [x] Snapshot manual e automático (antes de uploads e re-análises)
- [x] Listagem e restauração de versões anteriores
- [ ] Diff visual entre versões
- [ ] Deletar versão antiga

---

## Módulo 7 — UX / Interface

- [x] Sidebar lateral fixa com navegação por âncoras e highlight do item ativo (IntersectionObserver)
- [x] Dark theme (neutral-950)
- [x] Modal JSON para debug
- [-] Página única com scroll — **pode ficar pesada conforme cresce; considerar separar em rotas**
- [ ] Responsividade mobile (layout atual é desktop-first, quebra em telas pequenas)
- [ ] Feedback visual de erro melhorado (alert() nativo em vários pontos)

---

## Débito Técnico Conhecido

- `page.tsx` tem >850 linhas — estado centralizado, sem contexto/provider
- Vários `any` no TypeScript (RefinableBlock, EditableInput, etc.)
- `window.confirm` e `window.alert` em fluxos críticos — substituir por modal/toast
- `handleRestoreVersion` usa `window.location.reload()` — substituir por revalidação de estado
- Não há testes automatizados

---

## Próximas Prioridades (a definir com o usuário)

1. Educação e certificações no SSOT
2. Persistência de edições nos campos de plataforma
3. Responsividade mobile
4. Refatorar `page.tsx` em componentes menores
