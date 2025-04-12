import { ChatApp } from "@app/chat-app.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockAIAgent, MockTerminalInterface } from "../utils/mocks.js";

// Mocks para as dependências externas
vi.mock("@interface/terminal-interface.js", () => ({
  TerminalInterface: vi
    .fn()
    .mockImplementation(() => new MockTerminalInterface()),
}));

vi.mock("@infra/ai/ai-agent-factory.js", () => ({
  getAvailableModelTypes: vi.fn().mockReturnValue(["claude", "mcp", "openai"]),
  createAgent: vi.fn().mockReturnValue(new MockAIAgent()),
}));

// Acessar propriedades privadas
type PrivateChatApp = {
  terminal: MockTerminalInterface;
  agent: MockAIAgent | null;
  isRunning: boolean;
  setupAgent: () => Promise<void>;
  runChatLoop: () => Promise<void>;
  cleanup: () => Promise<void>;
};

describe("ChatApp", () => {
  let chatApp: ChatApp;
  let mockAgent: MockAIAgent;
  let mockTerminal: MockTerminalInterface;

  beforeEach(() => {
    // Limpar mocks
    vi.clearAllMocks();

    // Criar instância limpa para cada teste
    chatApp = new ChatApp();

    // Acessar membros privados para testes
    const privateChatApp = chatApp as unknown as PrivateChatApp;
    mockTerminal = privateChatApp.terminal as MockTerminalInterface;
    mockAgent = new MockAIAgent({ "test message": "test response" });
    privateChatApp.agent = mockAgent;
  });

  describe("start", () => {
    it("should initialize the app with welcome message", async () => {
      // Espionar métodos internos
      const setupAgentSpy = vi
        .spyOn(chatApp as unknown as PrivateChatApp, "setupAgent")
        .mockResolvedValue();
      const runChatLoopSpy = vi
        .spyOn(chatApp as unknown as PrivateChatApp, "runChatLoop")
        .mockResolvedValue();
      const cleanupSpy = vi
        .spyOn(chatApp as unknown as PrivateChatApp, "cleanup")
        .mockResolvedValue();

      await chatApp.start();

      // Verificar que a mensagem de boas-vindas foi exibida
      expect(mockTerminal.printedMessages[0]).toContain("Terminal Chat com IA");

      // Verificar que os métodos foram chamados na ordem correta
      expect(setupAgentSpy).toHaveBeenCalled();
      expect(runChatLoopSpy).toHaveBeenCalled();
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it("should handle errors during startup", async () => {
      const error = new Error("Test error");
      vi.spyOn(
        chatApp as unknown as PrivateChatApp,
        "setupAgent",
      ).mockRejectedValue(error);
      const cleanupSpy = vi
        .spyOn(chatApp as unknown as PrivateChatApp, "cleanup")
        .mockResolvedValue();

      await chatApp.start();

      // Verificar que o erro foi tratado
      expect(mockTerminal.printedErrors[0]).toContain("Test error");

      // Verificar que cleanup foi chamado mesmo com erro
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe("runChatLoop", () => {
    it("should handle user messages and get AI responses", async () => {
      // Configurar entrada do usuário
      mockTerminal.inputResponses = ["test message", "sair"];

      // Espionar o método sendMessage do agente
      const sendMessageSpy = vi.spyOn(mockAgent, "sendMessage");

      // Executar o loop de chat
      await (chatApp as unknown as PrivateChatApp).runChatLoop();

      // Verificar que a mensagem foi enviada ao agente
      expect(sendMessageSpy).toHaveBeenCalledWith("test message");

      // Verificar que a resposta foi exibida
      expect(mockTerminal.printedAIResponses.length).toBeGreaterThan(0);

      // Verificar que o loop foi encerrado corretamente
      expect(mockTerminal.printedMessages).toContain("\nEncerrando chat...");
    });

    it("should handle errors when sending messages", async () => {
      // Configurar entrada do usuário
      mockTerminal.inputResponses = ["error message", "sair"];

      // Configurar erro no agente
      vi.spyOn(mockAgent, "sendMessage").mockImplementation((message) => {
        if (message === "error message") {
          return Promise.reject(new Error("Test AI error"));
        }
        return Promise.resolve("Normal response");
      });

      // Executar o loop de chat
      await (chatApp as unknown as PrivateChatApp).runChatLoop();

      // Verificar que o erro foi tratado e exibido
      expect(mockTerminal.printedErrors[0]).toContain("Test AI error");
    });
  });

  describe("cleanup", () => {
    it("should close the agent and terminal", async () => {
      const closeSpy = vi.spyOn(mockAgent, "close");
      const terminalCloseSpy = vi.spyOn(mockTerminal, "close");

      await (chatApp as unknown as PrivateChatApp).cleanup();

      expect(closeSpy).toHaveBeenCalled();
      expect(terminalCloseSpy).toHaveBeenCalled();
      expect(mockTerminal.printedMessages).toContain("Aplicação encerrada.");
    });

    it("should handle errors during agent close", async () => {
      const error = new Error("Close error");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.spyOn(mockAgent, "close").mockRejectedValue(error);

      await (chatApp as unknown as PrivateChatApp).cleanup();

      expect(consoleSpy).toHaveBeenCalledWith("Error closing agent:", error);
      expect(mockTerminal.closed).toBe(true);
    });
  });
});
