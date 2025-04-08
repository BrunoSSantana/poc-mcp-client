# Terminal Chat com IA

Uma aplicação de chat no terminal que se integra com diferentes modelos de IA (Claude, GPT e MCP).

## Requisitos

- Node.js (v18 ou superior)
- PNPM

## Configuração

1. Clone o repositório
2. Instale as dependências:

```bash
pnpm install
```

3. Configure as variáveis de ambiente:

Crie o arquivo `.env` na raiz do projeto com base no `.env.example`:

```
# Necessário para o modelo Claude
ANTHROPIC_API_KEY=sua_chave_api_anthropic

# Necessário para o modelo GPT
OPENAI_API_KEY=sua_chave_api_openai
```

## Executando a aplicação

Para iniciar o chat:

```bash
pnpm start
```

Após iniciar a aplicação, você poderá:
1. Selecionar o modelo de IA (Claude, GPT ou MCP)
2. Configurar parâmetros adicionais para o modelo selecionado
3. Iniciar a conversa
4. Digitar "sair" a qualquer momento para encerrar o chat

## Funcionalidades

- Interface de chat simples no terminal
- Suporte para diferentes modelos de IA:
  - Claude (Anthropic) - Requer chave de API
  - GPT (OpenAI) - Requer chave de API
  - Model Context Protocol (MCP) - Usa o servidor MCP local
- Seleção do modelo de IA no início da interação
- Configuração de parâmetros adicionais para cada modelo
- Arquitetura desacoplada com componentes separados
- Path aliases para importações mais limpas

## Arquitetura

O projeto segue uma arquitetura limpa com separação clara de responsabilidades:

- `domain`: Interfaces e tipos centrais da aplicação
  - `ai-agent.ts`: Interface para agentes de IA
  - `ai-model.ts`: Tipos para configuração de modelos
- `infra`: Implementações concretas e integrações externas
  - `ai/anthropic-agent.ts`: Implementação do agente Claude
  - `ai/openai-agent.ts`: Implementação do agente GPT
  - `ai/mcp-agent.ts`: Implementação do agente MCP
  - `ai/ai-agent-factory.ts`: Factory para criação de agentes
- `interface`: Componentes para interação com o usuário
  - `terminal-interface.ts`: Interface para interação via terminal
- `app`: Coordenação de fluxos de alto nível
  - `chat-app.ts`: Classe principal que coordena a aplicação

### Path Aliases

O projeto utiliza path aliases para melhorar a legibilidade e manutenibilidade do código:

- `@domain/*`: Aponta para `src/domain/*`
- `@app/*`: Aponta para `src/app/*`
- `@interface/*`: Aponta para `src/interface/*`
- `@infra/*`: Aponta para `src/infra/*`
- `@/*`: Aponta para `src/*`

Exemplos de importação:
```typescript
import { AIAgent } from "@domain/ai-agent.js";
import { ChatApp } from "@app/chat-app.js";
```

## Extensibilidade

Para adicionar suporte a novos modelos de IA:
1. Atualize o tipo `AIModelType` em `src/domain/ai-model.ts`
2. Implemente uma nova classe que siga a interface `AIAgent`
3. Atualize a função `createAgent` em `src/infra/ai/ai-agent-factory.ts`
4. Atualize o mapeamento de nomes de modelo em `src/interface/terminal-interface.ts`

## Desenvolvimento

Para formatar o código:

```bash
pnpm format
```

Para verificar problemas de linting:

```bash
pnpm lint
```

Para compilar o projeto:

```bash
pnpm build
``` 