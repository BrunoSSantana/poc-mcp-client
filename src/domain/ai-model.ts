/**
 * Tipo que representa os modelos de IA disponíveis
 */
export type AIModelType = "claude" | "mcp" | "openai";

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
  params?: Record<string, unknown>;
}
