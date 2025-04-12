import type { AIModelConfig, AIModelType } from "@domain/ai-model.js";
import type { MCPConfig, MCPServerConfig } from "@domain/mcp-config.js";
import { getAvailableModelTypes } from "@infra/ai/ai-agent-factory.js";
import { TerminalInterface } from "@interface/terminal-interface.js";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Gerenciador de configuração de modelos de IA
 */
export class ModelConfigManager {
  private terminal: TerminalInterface;
  private mcpConfig: MCPConfig | null = null;

  /**
   * Cria uma nova instância do gerenciador de configuração
   */
  constructor() {
    this.terminal = new TerminalInterface();
    this.loadMCPConfig();
  }

  /**
   * Carrega a configuração do MCP do arquivo mcp.json
   */
  private loadMCPConfig(): void {
    try {
      const configPath = path.resolve(process.cwd(), "mcp.json");
      const configContent = fs.readFileSync(configPath, "utf-8");
      this.mcpConfig = JSON.parse(configContent) as MCPConfig;
    } catch (error) {
      this.terminal.printError(
        `Erro ao carregar configuração do MCP: ${(error as Error).message}`,
      );
      this.mcpConfig = null;
    }
  }

  /**
   * Solicita ao usuário que configure o modelo de IA
   * @returns Configuração do modelo de IA
   */
  async configureModel(): Promise<AIModelConfig> {
    const availableModels = getAvailableModelTypes();
    const selectedModel = await this.terminal.selectAIModel(availableModels);

    const { apiKey, model, mcpConfig } = await this.configureMCPParams(selectedModel);

    this.terminal.print(`\nConfigurando modelo: ${selectedModel}...`);

    const config: AIModelConfig = {
      type: selectedModel,
      params: {
        apiKey,
        model,
        mcpConfig,
      },
    };

/*     await this.configureModelSpecificParams(config);
 */
    return config;
  }

  /**
   * Configura parâmetros específicos para cada tipo de modelo
   * @param config - Configuração do modelo a ser atualizada
   */
/*   private async configureModelSpecificParams(
    config: AIModelConfig,
  ): Promise<void> {
    const useCustomConfig = await this.terminal.confirm(
      "Deseja configurar parâmetros adicionais para o modelo?",
    );

    if (!useCustomConfig) {
      return;
    }

    switch (config.type) {
      case "claude":
        await this.configureClaudeParams(config);
        break;
      case "openai":
        await this.configureOpenAIParams(config);
        break;
      default:
        throw new Error(`Modelo não suportado: ${config.type}`);
    }
  } */

  /**
   * Configura parâmetros específicos para o modelo Claude
   * @param config - Configuração do modelo a ser atualizada
   */
/*   private async configureClaudeParams(config: AIModelConfig): Promise<void> {
    const model = await this.terminal.input(
      "Modelo Claude (deixe em branco para usar o padrão 'claude-3-5-sonnet-20241022')",
    );
    if (model) {
      config.params.model = model;
    } else {
      config.params.model =
        process.env.CLAUDE_MODEL ?? "claude-3-5-sonnet-20241022";
    }

    const apiKey = await this.terminal.input(
      "Chave de API da Anthropic (deixe em branco para usar a variável de ambiente)",
    );
    if (apiKey) {
      config.params.apiKey = apiKey;
    } else {
      config.params.apiKey = process.env.CLAUDE_API_KEY ?? "";
    }
  } */

  /**
   * Configura parâmetros específicos para o modelo OpenAI
   * @param config - Configuração do modelo a ser atualizada
   */
/*   private async configureOpenAIParams(config: AIModelConfig): Promise<void> {
    const model = await this.terminal.input(
      "Modelo OpenAI (deixe em branco para usar o padrão 'gpt-4o')",
    );
    if (model) {
      config.params.model = model;
    } else {
      config.params.model = process.env.OPENAI_MODEL ?? "gpt-4o";
    }

    const apiKey = await this.terminal.input(
      "Chave de API da OpenAI (deixe em branco para usar a variável de ambiente)",
    );
    if (apiKey) {
      config.params.apiKey = apiKey;
    } else {
      config.params.apiKey = process.env.OPENAI_API_KEY ?? "";
    }
  } */

  /**
   * Configura parâmetros específicos para o modelo MCP
   * @param config - Configuração do modelo a ser atualizada
   */
  private async configureMCPParams(aiModel: AIModelType): Promise<{
    apiKey: string;
    model: string;
    mcpConfig: MCPServerConfig;
  }> {
    // Usar valores das variáveis de ambiente
    const apiKey = process.env[`${aiModel.toUpperCase()}_API_KEY`] ?? "";
    const model = process.env[`${aiModel.toUpperCase()}_MODEL`] ?? "";

    if (!this.mcpConfig) {
      this.terminal.printError(
        "Configuração do MCP não encontrada. Usando configuração padrão.",
      );
      throw new Error("Configuração do MCP não encontrada. Usando configuração padrão.");
    }

    // Listar servidores MCP disponíveis
    const serverNames = Object.keys(this.mcpConfig.mcpServers);

    if (serverNames.length === 0) {
      this.terminal.printError(
        "Nenhum servidor MCP encontrado na configuração. Usando configuração padrão.",
      );
      throw new Error("Nenhum servidor MCP encontrado na configuração. Usando configuração padrão.");
    }

    // Obter configuração do servidor selecionado
    const serverConfig = this.mcpConfig.mcpServers

    // Atualizar configuração do MCP
    const mcpConfig = Object.values(serverConfig).map((config) => ({
      command: config.command,
      args: config.args,
    })).at(0);

    if (!mcpConfig) {
      throw new Error("Configuração do MCP não encontrada. Usando configuração padrão.");
    }

    return {
      apiKey,
      model,
      mcpConfig,
    };
  }

  /**
   * Fecha a interface do terminal
   */
  close(): void {
    this.terminal.close();
  }
}
