import type { AIAgent } from "../../domain/ai-agent.js";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Implementação do agente de IA utilizando o serviço Anthropic (Claude)
 */
export class AnthropicAgent implements AIAgent {
	private client: Anthropic | null = null;
	private readonly apiKey: string;
	private readonly model: string;

	/**
	 * Cria uma instância do agente Anthropic
	 * @param apiKey - Chave de API da Anthropic (opcional, usa variável de ambiente se não fornecida)
	 * @param model - Modelo a ser utilizado (opcional, usa Claude 3 Sonnet por padrão)
	 */
	constructor(apiKey?: string, model = "claude-3-sonnet-20240229") {
		this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || "";
		this.model = model;

		if (!this.apiKey) {
			throw new Error("Anthropic API key is required");
		}
	}

	/**
	 * Inicializa o cliente Anthropic
	 */
	async initialize(): Promise<void> {
		this.client = new Anthropic({
			apiKey: this.apiKey,
		});
	}

	/**
	 * Envia uma mensagem para o modelo da Anthropic e retorna a resposta
	 * @param message - Mensagem do usuário
	 * @returns Resposta do modelo
	 */
	async sendMessage(message: string): Promise<string> {
		if (!this.client) {
			throw new Error("Anthropic client not initialized");
		}

		try {
			const response = await this.client.messages.create({
				model: this.model,
				max_tokens: 1000,
				messages: [{ role: "user", content: message }],
			});

			// Verificando e extraindo o texto da resposta de forma segura
			if (response.content[0] && "text" in response.content[0]) {
				return response.content[0].text;
			} else {
				return JSON.stringify(response.content[0]);
			}
		} catch (error) {
			console.error("Error sending message to Anthropic:", error);
			throw new Error(
				`Failed to get response from Anthropic: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Fecha a conexão (não necessário para Anthropic, mas implementado para seguir o contrato)
	 */
	async close(): Promise<void> {
		// Não há necessidade de fechar conexão com a API REST da Anthropic
		this.client = null;
	}
}
