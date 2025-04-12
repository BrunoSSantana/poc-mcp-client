/**
 * Configuração de ambiente para servidores MCP
 */
export type MCPEnvConfig = Record<string, string>;

/**
 * Configuração de um servidor MCP
 */
export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: MCPEnvConfig;
}

/**
 * Configuração dos servidores MCP
 */
export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}
