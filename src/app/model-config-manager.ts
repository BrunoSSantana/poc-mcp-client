import type { AIModelConfig, AIModelType } from "@domain/entities/ai-model.js";
import type {
  MCPConfig,
  MCPServerConfig,
} from "@domain/entities/mcp-config.js";
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

    const { apiKey, model, mcpConfig } =
      await this.configureMCPParams(selectedModel);

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
      throw new Error(
        "Configuração do MCP não encontrada. Usando configuração padrão.",
      );
    }

    // Listar servidores MCP disponíveis
    const serverNames = Object.keys(this.mcpConfig.mcpServers);

    if (serverNames.length === 0) {
      this.terminal.printError(
        "Nenhum servidor MCP encontrado na configuração. Usando configuração padrão.",
      );
      throw new Error(
        "Nenhum servidor MCP encontrado na configuração. Usando configuração padrão.",
      );
    }

    // Obter configuração do servidor selecionado
    const serverConfig = this.mcpConfig.mcpServers;

    // Atualizar configuração do MCP
    const mcpConfig = Object.values(serverConfig)
      .map((config) => ({
        command: config.command,
        args: config.args,
      }))
      .at(0);

    if (!mcpConfig) {
      throw new Error(
        "Configuração do MCP não encontrada. Usando configuração padrão.",
      );
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
