/**
 * Configuração de ambiente para servidores MCP
 */
export interface MCPEnvConfig {
  GRAPHQL_API: string;
  API_KEY: string;
}

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
