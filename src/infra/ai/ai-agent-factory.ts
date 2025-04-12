import type { AIAgent } from "@domain/ai-agent.js";
import type { AIModelConfig, AIModelType } from "@domain/ai-model.js";
import { AnthropicAgent } from "./anthropic-agent.js";
import { MCPAgent, type MCPClientConfig } from "./mcp-agent.js";
import { OpenAIAgent } from "./openai-agent.js";

/**
 * Cria um agente de IA com base na configuração fornecida
 * @param config - Configuração do modelo de IA
 * @returns Instância do agente de IA
 */
export function createAgent(config: AIModelConfig): AIAgent {
	switch (config.type) {
		case "claude":
			return new AnthropicAgent(
				config.params?.apiKey as string | undefined,
				config.params?.model as string | undefined,
			);
		case "mcp":
			return new MCPAgent(
				{
					command: "npm",
					args: [
						"exec",
						"--",
						"@smithery/cli@latest",
						"run",
						"@BrunoSSantana/poc-simple-mcp-server",
						"--config",
						'{"apiKey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdG1nYWtqZGhwc3JrdmFjbGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzNDE5OTUsImV4cCI6MjA1ODkxNzk5NX0.kbmZ0rbttSidrCHb2u6WWD5ummygL4Kb23usFXzv0Xo","graphQLApi":"https://titmgakjdhpsrkvaclef.supabase.co/graphql/v1"}',
					],
				} as MCPClientConfig,
				{
					type: "anthropic",
					apiKey: config.params?.apiKey as string | undefined,
					model: config.params?.model as string | undefined,
				},
			);
		case "openai":
			return new OpenAIAgent(
				config.params?.apiKey as string | undefined,
				config.params?.model as string | undefined,
			);
		default:
			throw new Error(`Unsupported AI model type: ${config.type}`);
	}
}

/**
 * Retorna os tipos de modelo disponíveis
 * @returns Array com os tipos de modelo disponíveis
 */
export function getAvailableModelTypes(): AIModelType[] {
	return ["claude", "mcp", "openai"];
}
