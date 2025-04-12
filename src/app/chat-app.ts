import type { AIAgent } from "@domain/ai-agent.js";
import { TerminalInterface } from "@interface/terminal-interface.js";

/**
 * Aplicação principal de chat que coordena a interação entre o usuário e o agente de IA
 */
export class ChatApp {
  private terminal: TerminalInterface;
  private isRunning = false;

  /**
   * Cria uma instância da aplicação de chat
   */
  constructor(private readonly agent: AIAgent) {
    this.terminal = new TerminalInterface();
  }

  /**
   * Inicia a aplicação
   */
  async start(): Promise<void> {
    this.terminal.print("=== Terminal Chat com IA ===");

    try {
      await this.agent.initialize();
      this.terminal.print("Agente de IA inicializado com sucesso!\n");
      await this.runChatLoop();

    } catch (error) {
      this.terminal.printError(
        `Erro ao inicializar o agente: ${(error as Error).message}`,
      );
      throw error;
    } finally {
      await this.cleanup();
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
        this.terminal.printAIResponse(response);
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
