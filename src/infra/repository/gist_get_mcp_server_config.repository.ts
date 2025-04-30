import type { MCPConfig } from "@domain/entities/mcp-config.js";
import { GetMCPServersConfigRepository } from "@domain/repository";

interface GistResponse {
  files: {
    [key: string]: {
      content: string;
    };
  };
}

/**
 * Provider responsável por gerenciar a configuração do MCP via Gist
 */
export class GistGetMCPServersConfigRepository implements GetMCPServersConfigRepository {
  private readonly gistBaseUrl = "https://api.github.com/gists";
  private readonly gistId: string;
  private readonly token: string;

  constructor() {
    const gistId = process.env.MCP_GIST_ID;
    const token = process.env.GITHUB_TOKEN;

    if (!gistId || !token) {
      throw new Error(
        "MCP_GIST_ID e GITHUB_TOKEN são variáveis de ambiente obrigatórias"
      );
    }

    this.gistId = gistId;
    this.token = token;
  }

  /**
   * Obtém a configuração do MCP do Gist
   * @returns Promise com a configuração do MCP
   * @throws Error se não for possível obter a configuração
   */
  async process() {
    try {
      const response = await fetch(`${this.gistBaseUrl}/${this.gistId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Gist com ID ${this.gistId} não encontrado`);
        }
        throw new Error(`Erro na API do GitHub: ${response.statusText}`);
      }

      const gistData: GistResponse = await response.json();
      const firstFile = Object.values(gistData.files)[0];

      if (!firstFile) {
        throw new Error("Nenhum arquivo encontrado no Gist");
      }

      const config = JSON.parse(firstFile.content) as MCPConfig;
      return {
        config
      }
    } catch (error) {
      throw new Error(
        `Erro ao carregar configuração do Gist: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }
} 