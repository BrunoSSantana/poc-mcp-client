import type { AIModelConfig } from "@domain/ai-model.js";
import {
	createAgent,
	getAvailableModelTypes,
} from "@infra/ai/ai-agent-factory.js";
import { AnthropicAgent } from "@infra/ai/anthropic-agent.js";
import { MCPAgent } from "@infra/ai/mcp-agent.js";
import { OpenAIAgent } from "@infra/ai/openai-agent.js";
import { describe, expect, it, vi } from "vitest";

// Mock dos módulos de agentes
vi.mock("@infra/ai/anthropic-agent.js", () => ({
	AnthropicAgent: vi.fn().mockImplementation(() => ({
		initialize: vi.fn().mockResolvedValue(undefined),
		sendMessage: vi.fn().mockResolvedValue("Mocked Anthropic response"),
		close: vi.fn().mockResolvedValue(undefined),
	})),
}));

vi.mock("@infra/ai/mcp-agent.js", () => ({
	MCPAgent: vi.fn().mockImplementation(() => ({
		initialize: vi.fn().mockResolvedValue(undefined),
		sendMessage: vi.fn().mockResolvedValue("Mocked MCP response"),
		close: vi.fn().mockResolvedValue(undefined),
	})),
}));

vi.mock("@infra/ai/openai-agent.js", () => ({
	OpenAIAgent: vi.fn().mockImplementation(() => ({
		initialize: vi.fn().mockResolvedValue(undefined),
		sendMessage: vi.fn().mockResolvedValue("Mocked OpenAI response"),
		close: vi.fn().mockResolvedValue(undefined),
	})),
}));

describe("AIAgentFactory", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getAvailableModelTypes", () => {
		it("should return all available model types", () => {
			const modelTypes = getAvailableModelTypes();

			expect(modelTypes).toHaveLength(3);
			expect(modelTypes).toContain("claude");
			expect(modelTypes).toContain("mcp");
			expect(modelTypes).toContain("openai");
		});
	});

	describe("createAgent", () => {
		it("should create AnthropicAgent with correct parameters when type is claude", () => {
			const config: AIModelConfig = {
				type: "claude",
				params: {
					apiKey: "test-api-key",
					model: "test-model",
				},
			};

			createAgent(config);

			expect(AnthropicAgent).toHaveBeenCalledWith("test-api-key", "test-model");
		});

		it("should create MCPAgent with correct parameters when type is mcp", () => {
			const mcpConfig = {
				command: "test-command",
				args: ["test-arg1", "test-arg2"],
			};

			const config: AIModelConfig = {
				type: "mcp",
				params: {
					config: mcpConfig,
					toolName: "test-tool",
				},
			};

			createAgent(config);

			expect(MCPAgent).toHaveBeenCalledWith(mcpConfig, "test-tool");
		});

		it("should create OpenAIAgent with correct parameters when type is openai", () => {
			const config: AIModelConfig = {
				type: "openai",
				params: {
					apiKey: "test-openai-key",
					model: "test-openai-model",
				},
			};

			createAgent(config);

			expect(OpenAIAgent).toHaveBeenCalledWith(
				"test-openai-key",
				"test-openai-model",
			);
		});

		it("should throw an error when type is not supported", () => {
			const config = {
				type: "unsupported-type",
			} as unknown as AIModelConfig;

			expect(() => createAgent(config)).toThrow(/Unsupported AI model type/);
		});
	});
});
