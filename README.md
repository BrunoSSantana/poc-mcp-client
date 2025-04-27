# MCP Client Server

Uma aplicação cliente-servidor baseada no Model Context Protocol (MCP) que se integra com diferentes modelos de IA (Claude, GPT) através de uma camada de abstração unificada.

## Recursos

- Interface CLI para chat interativo
- Servidor HTTP com API Fastify
- Integração com Model Context Protocol (MCP)
- Suporte para modelos OpenAI (GPT) e Anthropic (Claude)
- Arquitetura limpa com separação clara de responsabilidades

## Requisitos

- Node.js (v18 ou superior)
- PNPM

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/poc-mcp-client-server.git

# Navegar para o diretório do projeto
cd poc-mcp-client-server

# Instalar dependências
pnpm install
```

## Configuração

Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:

```
# Chave API para o modelo Claude (Anthropic)
CLAUDE_API_KEY=sua_chave_api_anthropic
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Chave API para o modelo GPT (OpenAI)
OPENAI_API_KEY=sua_chave_api_openai
OPENAI_MODEL=gpt-4o

# Configuração do MCP (Model Context Protocol)
MCP_COMMAND=comando_para_executar_mcp
MCP_ARGS=argumentos_para_o_comando_mcp
```

## Utilização

A aplicação pode ser executada em dois modos diferentes:

### Modo CLI

Para iniciar a aplicação no modo de linha de comando interativa:

```bash
# Inicia no modo CLI (padrão)
pnpm start

# Ou explicitamente:
pnpm start:cli
```

No modo CLI, você poderá:
1. Selecionar o modelo de IA (Claude ou OpenAI)
2. Configurar parâmetros adicionais para o modelo selecionado
3. Iniciar a conversa
4. Digitar "sair" a qualquer momento para encerrar o chat

### Modo Servidor HTTP

Para iniciar a aplicação como um servidor HTTP:

```bash
# Iniciar no modo servidor HTTP
pnpm start:server

# Especificar uma porta personalizada
pnpm start:server -- -p 8080
```

#### Endpoints HTTP

- `GET /health` - Verificação de saúde do servidor
- `POST /chat` - Enviar uma mensagem para o agente de IA
  ```json
  {
    "message": "Sua mensagem aqui"
  }
  ```

## Arquitetura

O projeto segue uma arquitetura limpa com separação clara de responsabilidades:

- `domain`: Definições centrais da aplicação
  - `entities/ai-agent.ts`: Interface para agentes de IA
  - `entities/ai-model.ts`: Tipos para configuração de modelos
  - `entities/mcp-config.ts`: Configuração para o MCP

- `infra`: Implementações concretas e integrações externas
  - `ai/mcp-agent.ts`: Implementação do agente MCP que gerencia a comunicação com os modelos
  - `ai/ai-agent-factory.ts`: Factory para criação de agentes

- `interface`: Componentes para interação com o usuário
  - `terminal-interface.ts`: Interface para interação via terminal
  - `cli-interface.ts`: Interface de linha de comando
  - `http-interface.ts`: Interface para API HTTP

- `app`: Coordenação de fluxos de alto nível
  - `chat-app.ts`: Classe principal que coordena a aplicação
  - `app-factory.ts`: Factory para criação de aplicações (CLI ou HTTP)
  - `model-config-manager.ts`: Gerenciamento de configurações de modelo

## Fluxo do MCP Client

O MCP Client segue um fluxo para processar prompts do usuário:

1. **Inicialização**:
   - O MCPAgent é inicializado com uma configuração para o provider LLM (Claude ou OpenAI)
   - Estabelece conexão com o servidor MCP e descobre as ferramentas disponíveis

2. **Processamento de Mensagens**:
   - Recebe a mensagem do usuário
   - Usa o serviço LLM configurado para interpretar a intenção do usuário
   - Identifica a ferramenta MCP mais adequada e extrai parâmetros relevantes

3. **Execução da Ferramenta**:
   - Valida os parâmetros extraídos contra o schema da ferramenta
   - Executa a ferramenta MCP com os parâmetros validados
   - Recebe o resultado da execução

4. **Geração de Resposta**:
   - O serviço LLM formata uma resposta contextualizada com base na mensagem original e no resultado da ferramenta
   - Retorna a resposta ao usuário

Este fluxo permite que o sistema utilize de forma eficiente as ferramentas MCP disponíveis, mantendo a capacidade de fornecer respostas naturais para o usuário.

## Path Aliases

O projeto utiliza path aliases para melhorar a legibilidade e manutenibilidade do código:

- `@domain/*`: Aponta para `src/domain/*`
- `@app/*`: Aponta para `src/app/*`
- `@interface/*`: Aponta para `src/interface/*`
- `@infra/*`: Aponta para `src/infra/*`
- `@/*`: Aponta para `src/*`

Exemplos de importação:
```typescript
import { AIAgent } from "@domain/entities/ai-agent.js";
import { ChatApp } from "@app/chat-app.js";
```

## Desenvolvimento

Para compilar o projeto:

```bash
pnpm build
```

Para formatar o código:

```bash
pnpm format
```

Para verificar problemas de linting:

```bash
pnpm lint
```

## Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Executar testes com cobertura
pnpm test:coverage
```

## Extensibilidade

Para adicionar suporte a novos modelos de IA:

1. Atualizar o tipo `LLMProvider` em `src/infra/ai/mcp-agent.ts`
2. Implementar um novo serviço LLM que estenda a classe `BaseLLMService`
3. Atualizar a função `createLLMService` em `src/infra/ai/mcp-agent.ts`
4. Adicionar as configurações necessárias para o novo modelo

## Licença

ISC 