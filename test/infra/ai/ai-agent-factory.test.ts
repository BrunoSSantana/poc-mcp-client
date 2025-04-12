import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AIModelConfig,
  AIModelType,
} from "../../../src/domain/entities/ai-model.js";
import {
  createAgent,
  getAvailableModelTypes,
} from "../../../src/infra/ai/ai-agent-factory.js";
import { MCPAgent } from "../../../src/infra/ai/mcp-agent.js";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAvailableModelTypes", () => {
    it("should return all available model types", () => {
      const modelTypes = getAvailableModelTypes();
      expect(modelTypes).toHaveLength(2);
      expect(modelTypes).toContain("claude");
      expect(modelTypes).toContain("openai");
    });
  });

  describe("createAgent", () => {
    it("should create MCPAgent with correct parameters", () => {
      const config: AIModelConfig = {
        type: "claude",
        params: {
          mcpConfig: {
            args: ["test-arg1", "test-arg2"],
            command: "test-command",
          },
          apiKey: "test-api-key",
          model: "test-model",
        },
      };

      createAgent(config);
      expect(MCPAgent).toHaveBeenCalledWith(config.params.mcpConfig, {
        type: "claude",
        apiKey: "test-api-key",
        model: "test-model",
      });
    });

    it("should throw an error when type is not supported", () => {
      const config = {
        type: "unsupported" as AIModelType,
        params: {
          apiKey: "",
          model: "",
          mcpConfig: {
            args: [],
            command: "",
          },
        },
      };

      expect(() => createAgent(config)).toThrow();
    });
  });
});
