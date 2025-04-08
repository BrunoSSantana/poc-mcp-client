import { OpenAIAgent } from "@infra/ai/openai-agent.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock para o OpenAI
const mockCreate = vi.fn();
vi.mock("openai", () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			chat: {
				completions: {
					create: mockCreate,
				},
			},
		})),
	};
});

// Tipo para acessar propriedades privadas
type PrivateOpenAIAgent = {
	apiKey: string;
	model: string;
	client: unknown;
};

describe("OpenAIAgent", () => {
	// Mock para a variável de ambiente
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv, OPENAI_API_KEY: "mock-env-api-key" };
		mockCreate.mockReset();
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.clearAllMocks();
	});

	describe("constructor", () => {
		it("should use provided API key", () => {
			const agent = new OpenAIAgent("test-api-key");
			expect((agent as unknown as PrivateOpenAIAgent).apiKey).toBe(
				"test-api-key",
			);
		});

		it("should use environment variable if no API key provided", () => {
			const agent = new OpenAIAgent();
			expect((agent as unknown as PrivateOpenAIAgent).apiKey).toBe(
				"mock-env-api-key",
			);
		});

		it("should use default model if not provided", () => {
			const agent = new OpenAIAgent("test-api-key");
			expect((agent as unknown as PrivateOpenAIAgent).model).toBe("gpt-4o");
		});

		it("should use provided model", () => {
			const agent = new OpenAIAgent("test-api-key", "gpt-3.5-turbo");
			expect((agent as unknown as PrivateOpenAIAgent).model).toBe(
				"gpt-3.5-turbo",
			);
		});

		it("should throw error if no API key is available", () => {
			process.env.OPENAI_API_KEY = "";
			expect(() => new OpenAIAgent()).toThrow("OpenAI API key is required");
		});
	});

	describe("sendMessage", () => {
		it("should throw error if not initialized", async () => {
			const agent = new OpenAIAgent("test-api-key");
			await expect(agent.sendMessage("test message")).rejects.toThrow(
				"OpenAI client not initialized",
			);
		});

		it("should call OpenAI client with correct parameters", async () => {
			const mockResponse = {
				choices: [
					{
						message: {
							content: "mock response content",
						},
					},
				],
			};

			mockCreate.mockResolvedValue(mockResponse);

			const agent = new OpenAIAgent("test-api-key");
			await agent.init();

			const result = await agent.sendMessage("test message");

			expect(mockCreate).toHaveBeenCalledWith({
				model: "gpt-4o",
				messages: [{ role: "user", content: "test message" }],
			});

			expect(result).toBe("mock response content");
		});

		it("should handle empty response", async () => {
			const mockResponse = {
				choices: [],
			};

			mockCreate.mockResolvedValue(mockResponse);

			const agent = new OpenAIAgent("test-api-key");
			await agent.init();

			const result = await agent.sendMessage("test message");

			expect(result).toBe("Não foi possível obter uma resposta.");
		});

		it("should handle API errors", async () => {
			mockCreate.mockRejectedValue(new Error("API Error"));

			const agent = new OpenAIAgent("test-api-key");
			await agent.init();

			try {
				await agent.sendMessage("test message");
				// Se chegar aqui, o teste falha
				expect(true).toBe(false);
			} catch (error) {
				expect(error.message).toContain("API Error");
			}
		});
	});

	describe("initialize and close", () => {
		it("should initialize and close correctly", async () => {
			const agent = new OpenAIAgent("test-api-key");

			await agent.init();
			expect((agent as unknown as PrivateOpenAIAgent).client).not.toBeNull();

			await agent.close();
			expect((agent as unknown as PrivateOpenAIAgent).client).toBeNull();
		});
	});
});
