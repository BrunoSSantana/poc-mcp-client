import type { AIAgent } from "../domain/AIAgent.js";
import type { AIModelConfig, AIModelType } from "../domain/AIModel.js";
import {
	createAgent,
	getAvailableModelTypes,
} from "../infra/ai/AIAgentFactory.js";
import { TerminalInterface } from "../interface/TerminalInterface.js";

/**
 * Aplicação principal de chat que coordena a interação entre o usuário e o agente de IA
 */
export class ChatApp {
	private terminal: TerminalInterface;
	private agent: AIAgent | null = null;
	private isRunning = false;

	/**
	 * Cria uma instância da aplicação de chat
	 */
	constructor() {
		this.terminal = new TerminalInterface();
	}

	/**
	 * Inicia a aplicação
	 */
	async start(): Promise<void> {
		try {
			this.terminal.print("=== Terminal Chat com IA ===");
			await this.setupAgent();
			await this.runChatLoop();
		} catch (error) {
			this.terminal.printError(
				`Erro ao iniciar a aplicação: ${(error as Error).message}`,
			);
		} finally {
			await this.cleanup();
		}
	}

	/**
	 * Configura o agente de IA com base na seleção do usuário
	 */
	private async setupAgent(): Promise<void> {
		const availableModels = getAvailableModelTypes();
		const selectedModel = await this.terminal.selectAIModel(availableModels);

		this.terminal.print(`\nConfigurando agente de IA: ${selectedModel}...`);

		// Configuração base do modelo
		const config: AIModelConfig = {
			type: selectedModel,
			params: {},
		};

		// Configurações específicas por modelo
		if (selectedModel === "claude") {
			// Perguntar se deseja usar configurações personalizadas
			const useCustomConfig = await this.terminal.confirm(
				"Deseja configurar parâmetros adicionais para o modelo Claude?",
			);

			if (useCustomConfig) {
				const model = await this.terminal.input(
					"Modelo Claude (deixe em branco para usar o padrão 'claude-3-sonnet-20240229')",
				);
				if (model) {
					config.params.model = model;
				}

				const apiKey = await this.terminal.input(
					"Chave de API da Anthropic (deixe em branco para usar a variável de ambiente)",
				);
				if (apiKey) {
					config.params.apiKey = apiKey;
				}
			}
		} else if (selectedModel === "mcp") {
			// Perguntar se deseja usar configurações personalizadas
			const useCustomConfig = await this.terminal.confirm(
				"Deseja configurar parâmetros adicionais para o MCP?",
			);

			if (useCustomConfig) {
				const toolName = await this.terminal.input(
					"Nome da ferramenta para chat (deixe em branco para usar o padrão 'get_employees')",
				);
				if (toolName) {
					config.params.toolName = toolName;
				}
			}
		}

		this.agent = createAgent(config);

		try {
			await this.agent.initialize();
			this.terminal.print("Agente de IA inicializado com sucesso!\n");
		} catch (error) {
			this.terminal.printError(
				`Erro ao inicializar o agente: ${(error as Error).message}`,
			);
			throw error;
		}
	}

	/**
	 * Executa o loop principal de chat
	 */
	private async runChatLoop(): Promise<void> {
		if (!this.agent) {
			throw new Error("Agent not initialized");
		}

		this.isRunning = true;
		this.terminal.print("Digite 'sair' para encerrar o chat.\n");

		while (this.isRunning) {
			const userMessage = await this.terminal.input("\nVocê");

			if (userMessage.toLowerCase() === "sair") {
				this.isRunning = false;
				this.terminal.print("\nEncerrando chat...");
				continue;
			}

			try {
				this.terminal.print("\nPensando...");
				const response = await this.agent.sendMessage(userMessage);
				this.terminal.printAIResponse(`\nIA: ${response}`);
			} catch (error) {
				this.terminal.printError(
					`Erro ao processar mensagem: ${(error as Error).message}`,
				);
			}
		}
	}

	/**
	 * Limpa recursos e encerra a aplicação
	 */
	private async cleanup(): Promise<void> {
		if (this.agent) {
			try {
				await this.agent.close();
			} catch (error) {
				console.error("Error closing agent:", error);
			}
		}

		this.terminal.close();
		this.terminal.print("Aplicação encerrada.");
	}
}
