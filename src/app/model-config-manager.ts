import type { AIModelConfig, AIModelType } from "@domain/entities/ai-model.js";
import type {
  MCPServerConfig
} from "@domain/entities/mcp-config.js";
import { GistGetMCPServersConfigRepository } from "@infra/repository";
import { TerminalInterface } from "@interface/terminal-interface.js";

/**
 * Gerenciador de configuração de modelos de IA
 */
export class ModelConfigManager {
  private terminal: TerminalInterface;
  
  /**
   * Cria uma nova instância do gerenciador de configuração
  */
 constructor(
    private getMCPServersConfigRepository: GistGetMCPServersConfigRepository
  ) {
    this.terminal = new TerminalInterface();
  }

  /**
   * Solicita ao usuário que configure o modelo de IA
   * @returns Configuração do modelo de IA
   */
  async configureModel(llmModel: AIModelType): Promise<AIModelConfig> {
    const { apiKey, model, mcpConfig } =
      await this.configureMCPParams(llmModel);

    this.terminal.print(`\nConfigurando modelo: ${llmModel}...`);

    const config: AIModelConfig = {
      type: llmModel,
      params: {
        apiKey,
        model,
        mcpConfig,
      },
    };

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

    const { config } = await  this.getMCPServersConfigRepository.process()

    if (!config) {
      this.terminal.printError(
        "Configuração do MCP não encontrada. Usando configuração padrão.",
      );
      throw new Error(
        "Configuração do MCP não encontrada. Usando configuração padrão.",
      );
    }

    // Listar servidores MCP disponíveis
    const serverNames = Object.keys(config.mcpServers);

    if (serverNames.length === 0) {
      this.terminal.printError(
        "Nenhum servidor MCP encontrado na configuração. Usando configuração padrão.",
      );
      throw new Error(
        "Nenhum servidor MCP encontrado na configuração. Usando configuração padrão.",
      );
    }

    // Obter configuração do servidor selecionado
    const serverConfig = config.mcpServers;

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
