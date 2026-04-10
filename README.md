# 🚀 Antigravity Career Manager

> Plataforma de gestão de carreira **orientada por IA** que automatiza a criação de currículos, perfil do LinkedIn e formulários de plataformas de recrutamento — usando seus projetos reais extraídos do Git.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)

---

## ✨ O que faz?

| Funcionalidade | Descrição |
|---|---|
| **Git Analyzer** | Extrai seus commits reais e usa IA para detectar tecnologias, desafios e seu papel (Dev / Tech Lead / Arquiteto) |
| **Upload de CV** | Absorve seu currículo em PDF e extrai dados estruturados via IA |
| **LinkedIn Maker** | Gera a seção "Sobre" e descrições de projetos no padrão STAR, prontos para copiar |
| **Exportar A4** | Gera um currículo visual profissional em PT-BR e EN-US, com Ctrl+P → PDF |
| **Automação de Plataformas** | A IA pesquisa os campos de qualquer plataforma (Gupy, Geekhunter, etc.) e preenche com seu perfil |
| **Refinamento por IA** | Cada bloco de texto gerado tem um botão de edição onde você instrui a IA a reescrever |

---

## 🏗️ Arquitetura

```
Next.js 16 (App Router)
├── src/app/                  # Páginas e rotas API
│   ├── page.tsx              # Dashboard principal
│   ├── cv/page.tsx           # Currículo A4 (Server Component)
│   └── api/
│       ├── git-analyzer/     # Analisa repositórios Git
│       ├── upload-cv/        # Processa PDF do currículo
│       ├── generate-linkedin/ # Gera textos para LinkedIn
│       ├── generate-platform/ # Mapeia campos de plataformas
│       ├── fill-platform/    # Preenche plataformas com seu perfil
│       ├── generate-pdf/     # Gera HTML de currículo
│       ├── refine/           # Refina qualquer bloco via IA
│       └── test-keys/        # Testa conectividade das APIs
├── src/lib/
│   ├── ai.ts                 # Proxy de IA Híbrido (ver abaixo)
│   ├── git.ts                # Extração de diffs do Git
│   └── prisma.ts             # Cliente do banco de dados
└── prisma/schema.prisma      # Modelos de dados
```

### 🤖 Sistema de IA Híbrido

O sistema usa uma arquitetura de **dois tiers** para economizar créditos:

- **Light Tier** (tarefas braçais — gratuito): Análise de chunks de código, extração de dados brutos
  - Tenta **Cerebras** → **Groq** → **OpenRouter** em ordem aleatória (load balancing)
  - Fallback automático para a CLI local se todas falharem

- **Heavy Tier** (tarefas nobres — CLI local): Geração final do currículo, LinkedIn, plataformas, refinamentos
  - Usa **Gemini CLI** ou **Claude CLI** instalado localmente

---

## 📋 Pré-requisitos

- **Node.js** 18+
- **Docker** (para o PostgreSQL) ou PostgreSQL 15 instalado
- **Git** instalado e configurado
- Uma das CLIs de IA local:
  - [Gemini CLI](https://github.com/google-gemini/gemini-cli) (`npm install -g @google/gemini-cli`)
  - [Claude CLI](https://docs.anthropic.com/claude/docs/claude-cli) (`npm install -g @anthropic-ai/claude-cli`)

---

## ⚡ Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/joserobson/gerenciador-carreira.git
cd gerenciador-carreira
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

Com Docker (recomendado):

```bash
docker run --name carreira-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gerenciador_carreira \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# Banco de dados (obrigatório)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gerenciador_carreira?schema=public"

# APIs Cloud Gratuitas para Light Tier (opcional, mas recomendado)
# Quanto mais chaves você colocar, maior a resiliência e menor o custo
GROQ_API_KEY=""          # https://console.groq.com
OPENROUTER_API_KEY=""    # https://openrouter.ai/keys
CEREBRAS_API_KEY=""      # https://cloud.cerebras.ai
```

> **Nota:** As chaves gratuitas são opcionais. Sem elas, **todas** as chamadas irão para a sua CLI local (Gemini/Claude), o que pode ser mais lento e consumir mais cota.

### 5. Rode as migrations do banco

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Inicie o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 🎯 Como usar

### Passo 1 — Extraia seus repositórios Git
1. Coloque o caminho do repositório (ex: `D:/projetos/meu-app`)
2. Informe seu nome de usuário Git para filtrar apenas seus commits
3. Clique em **Analisar Repositório**
4. Repita para todos os projetos relevantes

### Passo 2 — Faça o upload do seu CV atual (opcional)
- Envie seu PDF atual para referenciar dados pessoais (nome, e-mail, habilidades)

### Passo 3 — Gere seus textos
- **LinkedIn:** clique em "Gerar Resumo para LinkedIn" e refine cada bloco com a IA
- **PDF/A4:** clique em "Abrir Currículo A4" para visualizar e imprimir

### Passo 4 — Automatize plataformas
1. Digite o nome da plataforma (ex: `Geekhunter`)
2. Clique em **1. Mapear Plataforma** — a IA pesquisará os campos necessários
3. Clique em **2. Responder c/ Meu Perfil** — a IA preenche cada campo com seus dados
4. Use os botões ✨ para refinar campo por campo

---

## 🔑 Validando as chaves

Na barra de configurações do dashboard, clique em **🔌 Validar Chaves Free** para testar se Cerebras, Groq e OpenRouter estão funcionando corretamente.

---

## 🗄️ Banco de dados

Para visualizar os dados no Prisma Studio:

```bash
npx prisma studio
```

---

## 📁 Estrutura de dados

```prisma
UserProfile   # Seus dados pessoais (nome, e-mail, habilidades, CV)
Project       # Projetos extraídos do Git com análise de IA
Platform      # Schema de plataformas mapeadas pela IA
PlatformData  # Respostas geradas para cada plataforma
```

---

## 🤝 Contribuindo

1. Fork este repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona minha feature'`
4. Push para a branch: `git push origin feat/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

MIT © [José Robson](https://github.com/joserobson)
