import type { AIAgent } from "@domain/ai-agent.js";
import OpenAI from "openai";

/**
 * Implementação do agente de IA utilizando o serviço OpenAI
 */
export class OpenAIAgent implements AIAgent {
  private client: OpenAI | null = null;
  private readonly apiKey: string;
  private readonly model: string;

  /**
   * Cria uma instância do agente OpenAI
   * @param apiKey - Chave de API da OpenAI (opcional, usa variável de ambiente se não fornecida)
   * @param model - Modelo a ser utilizado (opcional, usa GPT-4o por padrão)
   */
  constructor(apiKey?: string, model = "gpt-4o") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model;

    if (!this.apiKey) {
      throw new Error("OpenAI API key is required");
    }
  }

  /**
   * Inicializa o cliente OpenAI
   */
  async initialize(): Promise<void> {
    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  /**
   * Envia uma mensagem para o modelo da OpenAI e retorna a resposta
   * @param message - Mensagem do usuário
   * @returns Resposta do modelo
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.client) {
      throw new Error("OpenAI client not initialized");
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: message }],
      });

      // Verificando e extraindo o texto da resposta de forma segura
      if (
        response.choices &&
        response.choices.length > 0 &&
        response.choices[0].message.content
      ) {
        return response.choices[0].message.content;
      }

      return "Não foi possível obter uma resposta.";
    } catch (error) {
      console.error("Error sending message to OpenAI:", error);
      throw new Error(
        `Failed to get response from OpenAI: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Fecha a conexão (não necessário para OpenAI, mas implementado para seguir o contrato)
   */
  async close(): Promise<void> {
    // Não há necessidade de fechar conexão com a API REST da OpenAI
    this.client = null;
  }
}
