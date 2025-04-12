import type { AIModelType } from "@domain/ai-model.js";
import inquirer from "inquirer";
import chalk from "chalk";

/**
 * Interface para interação com o usuário via terminal
 */
export class TerminalInterface {
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
    console.error(chalk.red(message));
  }

  /**
   * Exibe uma mensagem do agente de IA
   * @param message - Mensagem do agente
   */
  printAIResponse(message: string): void {
    console.log(chalk.cyan(message));
  }

  /**
   * Solicita uma entrada do usuário
   * @param prompt - Texto a ser exibido antes da entrada
   * @returns Promessa que resolve para a entrada do usuário
   */
  async input(prompt: string): Promise<string> {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message: prompt,
      },
    ]);
    return response.value;
  }

  /**
   * Solicita uma confirmação do usuário (sim/não)
   * @param prompt - Texto a ser exibido antes da entrada
   * @returns Promessa que resolve para true (sim) ou false (não)
   */
  async confirm(prompt: string): Promise<boolean> {
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "value",
        message: prompt,
        default: false,
      },
    ]);
    return response.value;
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
    const choices = options.map((option) => ({
      name: displayFn ? displayFn(option) : String(option),
      value: option,
    }));

    const response = await inquirer.prompt([
      {
        type: "list",
        name: "value",
        message: prompt,
        choices,
      },
    ]);

    return response.value;
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
    // Inquirer não precisa de cleanup explícito
  }
}
