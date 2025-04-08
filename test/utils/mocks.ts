import type { AIAgentInterface } from "@domain/ai-model.js";

/**
 * Mock simples para AIAgent
 */
export class MockAIAgent implements AIAgentInterface {
	private initialized = false;
	private responses: Record<string, string>;

	constructor(responses: Record<string, string> = {}) {
		this.responses = responses;
	}

	async init(): Promise<void> {
		this.initialized = true;
		return Promise.resolve();
	}

	async sendMessage(message: string): Promise<string> {
		if (!this.initialized) {
			throw new Error("Agent not initialized");
		}

		// Se houver uma resposta específica para esta mensagem, use-a
		if (this.responses[message]) {
			return Promise.resolve(this.responses[message]);
		}

		// Caso contrário, retorne uma resposta padrão
		return Promise.resolve(`Mock response to: ${message}`);
	}

	async close(): Promise<void> {
		this.initialized = false;
		return Promise.resolve();
	}
}

/**
 * Mock para TerminalInterface
 */
export class MockTerminalInterface {
	public printedMessages: string[] = [];
	public printedErrors: string[] = [];
	public printedAIResponses: string[] = [];
	public inputResponses: string[] = [];
	public closed = false;

	print(message: string): void {
		this.printedMessages.push(message);
	}

	printError(error: string | Error): void {
		const errorMessage = error instanceof Error ? error.message : error;
		this.printedErrors.push(errorMessage);
	}

	printAIResponse(message: string): void {
		this.printedAIResponses.push(message);
	}

	async input(prompt: string): Promise<string> {
		this.printedMessages.push(prompt);
		const response = this.inputResponses.shift() || "";
		return Promise.resolve(response);
	}

	close(): void {
		this.closed = true;
	}
}
