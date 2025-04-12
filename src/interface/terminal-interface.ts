import type { AIModelType } from "@domain/ai-model.js";
import * as readline from "node:readline";

/**
 * Interface para interação com o usuário via terminal
 */
export class TerminalInterface {
  private rl: readline.Interface;

  /**
   * Cria uma instância da interface de terminal
   */
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Exibe uma mensagem no terminal
   * @param message - Mensagem a ser exibida
   */
  print(message: string): void {
    console.log(message);
  }

  /**
   * Exibe uma mensagem de erro no terminal
   * @param message - Mensagem de erro a ser exibida
   */
  printError(message: string): void {
    console.error(`\x1b[31m${message}\x1b[0m`);
  }

  /**
   * Exibe uma mensagem do agente de IA
   * @param message - Mensagem do agente
   */
  printAIResponse(message: string): void {
    console.log(`\x1b[36m${message}\x1b[0m`);
  }

  /**
   * Solicita uma entrada do usuário
   * @param prompt - Texto a ser exibido antes da entrada
   * @returns Promessa que resolve para a entrada do usuário
   */
  async input(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(`${prompt}: `, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Solicita uma confirmação do usuário (sim/não)
   * @param prompt - Texto a ser exibido antes da entrada
   * @returns Promessa que resolve para true (sim) ou false (não)
   */
  async confirm(prompt: string): Promise<boolean> {
    let response: string;

    do {
      response = await this.input(`${prompt} (s/n)`);
      response = response.toLowerCase().trim();

      if (
        response !== "s" &&
        response !== "n" &&
        response !== "sim" &&
        response !== "não" &&
        response !== "nao"
      ) {
        this.printError("Por favor, responda com 's' ou 'n'");
      }
    } while (
      response !== "s" &&
      response !== "n" &&
      response !== "sim" &&
      response !== "não" &&
      response !== "nao"
    );

    return response === "s" || response === "sim";
  }

  /**
   * Apresenta opções para o usuário e solicita uma escolha
   * @param options - Opções disponíveis
   * @param prompt - Texto a ser exibido antes das opções
   * @returns Promessa que resolve para a opção escolhida
   */
  async selectOption<T>(
    options: T[],
    prompt: string,
    displayFn?: (option: T) => string,
  ): Promise<T> {
    console.log(prompt);

    options.forEach((option, index) => {
      console.log(
        `${index + 1}. ${displayFn ? displayFn(option) : String(option)}`,
      );
    });

    let selection: number;

    do {
      const input = await this.input("Digite o número da opção desejada");
      selection = Number.parseInt(input, 10) - 1;

      if (
        Number.isNaN(selection) ||
        selection < 0 ||
        selection >= options.length
      ) {
        this.printError("Opção inválida, tente novamente");
      }
    } while (
      Number.isNaN(selection) ||
      selection < 0 ||
      selection >= options.length
    );

    return options[selection];
  }

  /**
   * Solicita ao usuário que selecione um modelo de IA
   * @param availableModels - Modelos disponíveis
   * @returns Promessa que resolve para o modelo selecionado
   */
  async selectAIModel(availableModels: AIModelType[]): Promise<AIModelType> {
    const modelTypeMap: Record<AIModelType, string> = {
      claude: "Claude (Anthropic)",
      openai: "GPT (OpenAI)",
    };

    return this.selectOption(
      availableModels,
      "Selecione o modelo de IA:",
      (model) => modelTypeMap[model] || String(model),
    );
  }

  /**
   * Fecha a interface do terminal
   */
  close(): void {
    this.rl.close();
  }
}
