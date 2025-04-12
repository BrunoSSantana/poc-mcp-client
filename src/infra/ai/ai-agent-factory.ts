import type { AIAgent } from "@domain/ai-agent.js";
import type { AIModelConfig, AIModelType } from "@domain/ai-model.js";
import { MCPAgent } from "./mcp-agent.js";

/**
 * Cria um agente de IA com base na configuração fornecida
 * @param config - Configuração do modelo de IA
 * @returns Instância do agente de IA
 */
export function createAgent(config: AIModelConfig): AIAgent {
  const { type, params } = config;

  return new MCPAgent(params.mcpConfig, {
    type,
    apiKey: params.apiKey,
    model: params.model,
  });
}

/**
 * Retorna os tipos de modelo disponíveis
 * @returns Array com os tipos de modelo disponíveis
 */
export function getAvailableModelTypes(): AIModelType[] {
  return ["claude", "openai"];
}
