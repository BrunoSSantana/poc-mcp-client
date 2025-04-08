import type { AIAgent } from "../../domain/ai-agent.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Implementação do agente de IA utilizando o Model Context Protocol
 */
export class MCPAgent implements AIAgent {
	private client: Client | null = null;
	private transport: StdioClientTransport | null = null;
	private readonly config: {
		command: string;
		args: string[];
	};
	private readonly toolName: string;

	/**
	 * Cria uma instância do agente MCP
	 * @param config - Configuração para o MCP (opcional, usa valores padrão se não fornecida)
	 * @param toolName - Nome da ferramenta a ser usada para chat (opcional, usa 'get_employees' por padrão)
	 */
	constructor(
		config?: {
			command: string;
			args: string[];
		},
		toolName = "get_employees",
	) {
		this.config = config || {
			command: "npm",
			args: [
				"exec",
				"--",
				"@smithery/cli@latest",
				"run",
				"@BrunoSSantana/poc-simple-mcp-server",
				"--config",
				'{"apiKey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdG1nYWtqZGhwc3JrdmFjbGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzNDE5OTUsImV4cCI6MjA1ODkxNzk5NX0.kbmZ0rbttSidrCHb2u6WWD5ummygL4Kb23usFXzv0Xo","graphQLApi":"https://titmgakjdhpsrkvaclef.supabase.co/graphql/v1"}',
			],
		};
		this.toolName = toolName;
	}

	/**
	 * Inicializa o cliente MCP
	 */
	async initialize(): Promise<void> {
		try {
			this.transport = new StdioClientTransport(this.config);

			this.transport.onerror = (error: Error) => {
				console.error("Transport error:", error);
				throw new Error(`Transport error: ${error.message}`);
			};

			this.client = new Client(
				{ name: "terminal-chat", version: "1.0.0" },
				{ capabilities: { tools: {}, resources: {}, prompts: {} } },
			);

			await this.client.connect(this.transport);

			// Listar ferramentas disponíveis
			const tools = await this.client.listTools();
			console.log(
				"MCP inicializado com sucesso. Ferramentas disponíveis:",
				tools.tools.map((tool) => tool.name).join(", "),
			);

			// Verifica se a ferramenta solicitada está disponível
			if (!tools.tools.some((tool) => tool.name === this.toolName)) {
				console.warn(
					`Aviso: A ferramenta "${this.toolName}" não está disponível. Ferramentas disponíveis: ${tools.tools.map((tool) => tool.name).join(", ")}`,
				);
			}
		} catch (error) {
			console.error("Error initializing MCP client:", error);
			throw new Error(
				`Failed to initialize MCP client: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Envia uma mensagem para o servidor MCP e retorna a resposta
	 * @param message - Mensagem do usuário
	 * @returns Resposta do servidor
	 */
	async sendMessage(message: string): Promise<string> {
		if (!this.client) {
			throw new Error("MCP client not initialized");
		}

		try {
			const result = await this.client.callTool({
				name: this.toolName,
				arguments: { message },
			});

			return typeof result === "object"
				? JSON.stringify(result, null, 2)
				: String(result);
		} catch (error) {
			console.error("Error sending message to MCP server:", error);
			throw new Error(
				`Failed to get response from MCP server: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Fecha a conexão com o servidor MCP
	 */
	async close(): Promise<void> {
		if (this.client) {
			await this.client.close();
			this.client = null;
			this.transport = null;
		}
	}
}
