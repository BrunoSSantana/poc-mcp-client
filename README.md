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
CLAUDE_API_KEY=sua_chave_api_anthropic
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Necessário para o modelo GPT
OPENAI_API_KEY=sua_chave_api_openai
OPENAI_MODEL=gpt-4o

# Configuração do MCP
MCP_API_KEY=sua_chave_api_mcp
MCP_GRAPHQL_API=sua_url_graphql_mcp
MCP_MODEL=mcp-default
```

## Executando a aplicação

Para iniciar o chat:

```bash
pnpm start
```

Após iniciar a aplicação, você poderá:
1. Selecionar o modelo de IA (Claude ou GPT)
2. Configurar parâmetros adicionais para o modelo selecionado
3. Iniciar a conversa
4. Digitar "sair" a qualquer momento para encerrar o chat

## Funcionalidades

- Interface de chat simples no terminal
- Suporte para diferentes modelos de IA:
  - Claude (Anthropic) - Requer chave de API
  - GPT (OpenAI) - Requer chave de API
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

## Fluxo do MCP Client

O MCP Client segue um fluxo inteligente para processar prompts do usuário:

1. **Recebimento do Prompt**: O usuário envia um prompt inicial para o sistema.

2. **Análise de Servidores e Tools**:
   - O sistema lista os servidores MCP disponíveis
   - Identifica as tools disponíveis em cada servidor

3. **Avaliação de Tools**:
   - Analisa as tools disponíveis com base na descrição do prompt
   - Bifurca em dois caminhos possíveis:
     - Tool útil encontrada
     - Nenhuma tool útil encontrada

4. **Processamento com Tool**:
   Se uma tool útil é encontrada:
   - Gera input específico para a tool baseado no prompt original
   - Executa a tool com o input gerado
   - Recebe a resposta da tool
   - AI formula uma resposta final baseada no resultado da tool

5. **Processamento sem Tool**:
   Se nenhuma tool útil é encontrada:
   - A AI procede com uma resposta padrão

Este fluxo garante que o sistema utilize de forma eficiente as tools disponíveis quando apropriado, mantendo a capacidade de fornecer respostas mesmo quando nenhuma tool específica se aplica ao prompt.

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

## Testes

O projeto inclui testes unitários para todos os componentes principais:

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Executar testes com cobertura
pnpm test:coverage
```

A estrutura de testes segue a mesma organização do código fonte:

- `test/domain/`: Testes para interfaces e tipos
- `test/infra/`: Testes para implementações concretas
- `test/interface/`: Testes para componentes de interface
- `test/app/`: Testes para fluxos de aplicação

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

# MCP Client Server

A client server application for MCP (Model Context Protocol) with both CLI and HTTP interfaces.

## Features

- CLI interface for interactive chat
- HTTP API server with Fastify
- Support for different AI models

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/poc-mcp-client-server.git

# Navigate to the project directory
cd poc-mcp-client-server

# Install dependencies
pnpm install
```

## Usage

### CLI Mode

Run the application in CLI mode:

```bash
# Start in CLI mode (default)
pnpm start

# Explicitly specify CLI mode
pnpm start:cli
```

#### CLI Commands

```bash
# Start interactive chat session
mcp-client chat

# Send a single message and get response
mcp-client prompt "Your message here"
```

### HTTP Server Mode

Run the application as an HTTP server:

```bash
# Start in HTTP server mode
pnpm start:server
```

#### HTTP Endpoints

- `GET /health` - Health check endpoint
- `POST /chat` - Send a message to the AI agent
  ```json
  {
    "message": "Your message here"
  }
  ```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# OpenAI API configuration
OPENAI_API_KEY=your_openai_api_key

# Anthropic API configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Development

```bash
# Run tests
pnpm test

# Format code
pnpm format

# Lint code
pnpm lint
```

## License

ISC 