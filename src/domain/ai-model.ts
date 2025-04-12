import type { MCPClientConfig } from "@infra/ai/mcp-agent.js";

/**
 * Tipo que representa os modelos de IA disponíveis
 */
export type AIModelType = "claude" | "openai";

/**
 * Interface que define as configurações para inicialização de um modelo de IA
 */
export interface AIModelConfig {
  /**
   * Tipo do modelo de IA
   */
  type: AIModelType;

  /**
   * Parâmetros específicos para cada tipo de modelo
   */
  params: {
    apiKey: string;
    model: string;
    mcpConfig: MCPClientConfig;
  };
}
