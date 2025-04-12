import type { AIModelConfig, AIModelType } from "@domain/entities/ai-model.js";
import { describe, expect, it } from "vitest";

describe("AIModel Domain Types", () => {
  it("should correctly type AIModelType", () => {
    // Verificando que os valores corretos são aceitos
    const validTypes: AIModelType[] = ["claude", "mcp", "openai"];

    for (const type of validTypes) {
      // Esta atribuição deve compilar corretamente
      const config: AIModelConfig = { type };
      expect(config.type).toBe(type);
    }
  });

  it("should allow optional params in AIModelConfig", () => {
    // Teste sem parâmetros
    const configWithoutParams: AIModelConfig = {
      type: "claude",
    };
    expect(configWithoutParams.params).toBeUndefined();

    // Teste com parâmetros
    const configWithParams: AIModelConfig = {
      type: "claude",
      params: {
        apiKey: "test-key",
        model: "test-model",
      },
    };

    expect(configWithParams.params).toBeDefined();
    expect(configWithParams.params?.apiKey).toBe("test-key");
    expect(configWithParams.params?.model).toBe("test-model");
  });
});
