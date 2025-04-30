import type { AIAgent } from "@domain/entities/ai-agent.js";
import { Command } from "commander";
import { TerminalInterface } from "./terminal-interface.js";

/**
 * Interface for CLI interaction using Commander
 */
export class CliInterface {
  private program: Command;
  private terminal: TerminalInterface;

  /**
   * Creates a CLI interface instance
   */
  constructor(private readonly agent: AIAgent) {
    this.program = new Command();
    this.terminal = new TerminalInterface();
  }

  /**
   * Initializes the CLI parser with commands
   */
  initialize(): void {
    this.program
      .name("mcp-client")
      .description("MCP Client - Chat with AI models")
      .version("1.0.0");

    this.program
      .command("chat")
      .description("Start interactive chat session")
      .action(async () => {
        await this.startInteractiveChat();
      });

    this.program
      .command("prompt <message>")
      .description("Send a single message and get response")
      .action(async (message: string) => {
        await this.sendSingleMessage(message);
      });

    // Add default command (chat if no command specified)
    this.program.action(async () => {
      await this.startInteractiveChat();
    });
  }

  /**
   * Parses arguments and runs the CLI
   */
  async run(args: string[]): Promise<void> {
    try {
      // Initialize the agent before parsing commands
      await this.agent.initialize();
      this.program.parse(args);
    } catch (error) {
      this.terminal.printError(
        `Initialization error: ${(error as Error).message}`,
      );
      process.exit(1);
    }
  }

  /**
   * Starts an interactive chat session
   */
  private async startInteractiveChat(): Promise<void> {
    this.terminal.print("=== Terminal Chat com IA ===");
    this.terminal.print("Digite 'sair' para encerrar o chat.\n");

    let isRunning = true;

    while (isRunning) {
      const userMessage = await this.terminal.input("\nVocê");

      if (userMessage.toLowerCase() === "sair") {
        isRunning = false;
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

    await this.cleanup();
  }

  /**
   * Sends a single message and outputs the response
   */
  private async sendSingleMessage(message: string): Promise<void> {
    try {
      this.terminal.print("Processando mensagem...");
      const response = await this.agent.sendMessage(message);
      this.terminal.printAIResponse(response);
    } catch (error) {
      this.terminal.printError(
        `Erro ao processar mensagem: ${(error as Error).message}`,
      );
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Cleans up resources before exit
   */
  private async cleanup(): Promise<void> {
    try {
      await this.agent.close();
    } catch (error) {
      this.terminal.printError(
        `Error closing agent: ${(error as Error).message}`,
      );
    }
    this.terminal.close();
  }
}
