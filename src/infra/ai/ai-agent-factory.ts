import type { AIAgent } from "@domain/ai-agent.js";
import type { AIModelConfig, AIModelType } from "@domain/ai-model.js";
import { AnthropicAgent } from "./anthropic-agent.js";
import { MCPAgent } from "./mcp-agent.js";

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
				config.params?.config as
					| { command: string; args: string[] }
					| undefined,
				config.params?.toolName as string | undefined,
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
	return ["claude", "mcp"];
}
