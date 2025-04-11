import Anthropic from "@anthropic-ai/sdk";
import type { AIAgent } from "@domain/ai-agent.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";

/**
 * Interface que representa uma ferramenta MCP disponível
 */
interface MCPTool {
	name: string;
	description?: string;
	inputSchema?: Record<string, unknown>;
}

/**
 * Implementação do agente de IA utilizando o Model Context Protocol
 */
export class MCPAgent implements AIAgent {
	private client: Client | null = null;
	private transport: StdioClientTransport | null = null;
	private llmClient: Anthropic | null = null;
	private readonly config: {
		command: string;
		args: string[];
	};
	private readonly defaultToolName: string;
	private availableTools: MCPTool[] = [];
	private readonly llmApiKey: string;
	private readonly llmModel: string;

	/**
	 * Cria uma instância do agente MCP
	 * @param config - Configuração para o MCP (opcional, usa valores padrão se não fornecida)
	 * @param defaultToolName - Nome da ferramenta padrão a ser usada (opcional, usa 'get_employees' por padrão)
	 * @param llmConfig - Configuração para o LLM utilizado na interpretação de mensagens
	 */
	constructor(
		config?: {
			command: string;
			args: string[];
		},
		defaultToolName = "get_employees",
		llmConfig?: {
			apiKey?: string;
			model?: string;
		},
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
		this.defaultToolName = defaultToolName;
		this.llmApiKey = llmConfig?.apiKey || process.env.ANTHROPIC_API_KEY || "";
		this.llmModel = llmConfig?.model || "claude-3-sonnet-20240229";

		if (!this.llmApiKey) {
			console.warn(
				"LLM API key não fornecida. A interpretação avançada de mensagens não estará disponível.",
			);
		}
	}

	/**
	 * Inicializa o cliente MCP e o cliente LLM
	 */
	async initialize(): Promise<void> {
		try {
			// Inicializa o cliente MCP
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

			// Listar e armazenar ferramentas disponíveis
			const toolsResult = await this.client.listTools();
			this.availableTools = toolsResult.tools;

			console.log(
				"MCP inicializado com sucesso. Ferramentas disponíveis:",
				this.availableTools.map((tool) => tool.name).join(", "),
			);

			// Verifica se a ferramenta padrão está disponível
			if (
				!this.availableTools.some((tool) => tool.name === this.defaultToolName)
			) {
				console.warn(
					`Aviso: A ferramenta padrão "${this.defaultToolName}" não está disponível. Ferramentas disponíveis: ${this.availableTools.map((tool) => tool.name).join(", ")}`,
				);
			}

			// Inicializa o cliente LLM se a API key estiver disponível
			if (this.llmApiKey) {
				this.llmClient = new Anthropic({
					apiKey: this.llmApiKey,
				});
				console.log("Cliente LLM inicializado com sucesso.");
			}
		} catch (error) {
			console.error("Error initializing MCP client:", error);
			throw new Error(
				`Failed to initialize MCP client: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Cria um schema Zod a partir de um schema JSON
	 * @param schema - Schema JSON da ferramenta
	 * @returns Schema Zod correspondente
	 */
	private createZodSchema(schema: Record<string, unknown>): z.ZodTypeAny {
		// Implementação básica, pode ser expandida conforme necessário
		if (!schema || !schema.properties) {
			return z.object({}).passthrough();
		}

		const schemaProperties = schema.properties as Record<
			string,
			Record<string, unknown>
		>;
		const schemaRequired = Array.isArray(schema.required)
			? schema.required
			: [];

		const schemaEntries = Object.entries(schemaProperties).map(
			([key, prop]) => {
				let zodType: z.ZodTypeAny;

				switch (prop.type as string) {
					case "string":
						zodType = z.string();
						break;
					case "number":
						zodType = z.number();
						break;
					case "boolean":
						zodType = z.boolean();
						break;
					case "object":
						zodType = this.createZodSchema(prop as Record<string, unknown>);
						break;
					case "array":
						zodType = z.array(
							this.createZodSchema(
								(prop.items as Record<string, unknown>) || {},
							),
						);
						break;
					default:
						zodType = z.any();
				}

				// Torna opcional se não for requerido
				if (!schemaRequired.includes(key)) {
					zodType = zodType.optional();
				}

				return [key, zodType];
			},
		);

		return z.object(Object.fromEntries(schemaEntries));
	}

	/**
	 * Gera um prompt para o LLM que descreve as ferramentas disponíveis e pede para analisar a mensagem do usuário
	 * @param userMessage - Mensagem do usuário
	 * @returns O prompt a ser enviado para o LLM
	 */
	private generateToolSelectionPrompt(userMessage: string): string {
		const toolsDescription = this.availableTools
			.map((tool) => {
				const schemaStr = tool.inputSchema
					? `\nSchema de entrada: ${JSON.stringify(tool.inputSchema, null, 2)}`
					: "";

				return `
Ferramenta: ${tool.name}
Descrição: ${tool.description || "Sem descrição disponível"}${schemaStr}
`;
			})
			.join("\n");

		return `
Você é um assistente especializado em analisar a intenção dos usuários e selecionar as ferramentas adequadas. Sua tarefa é analisar a mensagem do usuário e determinar qual ferramenta de API deve ser usada e quais parâmetros devem ser extraídos da mensagem.

Ferramentas disponíveis:
${toolsDescription}

Mensagem do usuário: "${userMessage}"

Analise a mensagem do usuário e:
1. Identifique a ferramenta mais adequada para responder à solicitação.
2. Extraia os parâmetros relevantes da mensagem que devem ser passados para a ferramenta.
3. Formate os parâmetros como um objeto JSON válido que corresponda ao schema da ferramenta.

Responda APENAS com um objeto JSON com o seguinte formato:
{
  "toolName": "nome_da_ferramenta",
  "reason": "explicação curta sobre por que esta ferramenta é apropriada",
  "parameters": { objeto com os parâmetros extraídos da mensagem }
}

Se nenhuma ferramenta específica for mencionada ou se a intenção não estiver clara, use a ferramenta padrão "${this.defaultToolName}" com a mensagem completa como parâmetro.
`;
	}

	/**
	 * Usa o LLM para analisar a mensagem do usuário e determinar a ferramenta e os parâmetros
	 * @param message - Mensagem do usuário
	 * @returns Objeto com a ferramenta selecionada e os parâmetros
	 */
	private async analyzeLLMResponse(
		message: string,
	): Promise<{ toolName: string; params: Record<string, unknown> }> {
		if (!this.llmClient) {
			throw new Error("LLM client not initialized");
		}

		try {
			const prompt = this.generateToolSelectionPrompt(message);

			const response = await this.llmClient.messages.create({
				model: this.llmModel,
				max_tokens: 1000,
				system:
					"Você é um assistente especializado em NLP, focado em extrair a intenção do usuário e mapear para ferramentas de API específicas. Responda apenas com o formato JSON solicitado.",
				messages: [{ role: "user", content: prompt }],
			});

			// Verificando e extraindo o texto da resposta de forma segura
			if (!response.content[0] || !("text" in response.content[0])) {
				throw new Error("Formato de resposta do LLM inesperado");
			}

			const responseText = response.content[0].text.trim();
			const jsonMatch =
				responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
				responseText.match(/\{[\s\S]*\}/);

			if (!jsonMatch) {
				throw new Error(
					"Não foi possível extrair um JSON válido da resposta do LLM",
				);
			}

			const jsonString = jsonMatch[0].replace(/```json|```/g, "").trim();
			const result = JSON.parse(jsonString);

			// Verificar se o resultado contém os campos esperados
			if (!result.toolName || !result.parameters) {
				throw new Error("Resposta do LLM não contém os campos necessários");
			}

			// Verificar se a ferramenta selecionada existe
			if (!this.availableTools.some((tool) => tool.name === result.toolName)) {
				console.warn(
					`Ferramenta "${result.toolName}" selecionada pelo LLM não existe. Usando ferramenta padrão.`,
				);
				return {
					toolName: this.defaultToolName,
					params: { message },
				};
			}

			return {
				toolName: result.toolName,
				params: result.parameters,
			};
		} catch (error) {
			console.warn("Erro ao analisar resposta do LLM:", error);
			return {
				toolName: this.defaultToolName,
				params: { message },
			};
		}
	}

	/**
	 * Método simples para identificar a ferramenta com base em padrões na mensagem
	 * (Usado como fallback quando o LLM não estiver disponível)
	 */
	private identifyToolFromMessage(message: string): {
		toolName: string;
		params: Record<string, unknown>;
	} {
		// Exemplo simples: verifica se a mensagem menciona explicitamente uma ferramenta
		let toolName = this.defaultToolName;
		const params: Record<string, unknown> = { message };

		for (const tool of this.availableTools) {
			if (message.toLowerCase().includes(`use ${tool.name.toLowerCase()}`)) {
				toolName = tool.name;
				break;
			}
		}

		return { toolName, params };
	}

	/**
	 * Interpreta a mensagem do usuário para determinar qual ferramenta usar
	 * @param message - Mensagem do usuário
	 * @returns Objeto contendo nome da ferramenta e parâmetros para chamar
	 */
	private async interpretMessage(
		message: string,
	): Promise<{ toolName: string; params: Record<string, unknown> }> {
		if (!this.client) {
			throw new Error("MCP client not initialized");
		}

		try {
			// Se o LLM estiver disponível, usa-o para analisar a mensagem
			if (this.llmClient) {
				const llmAnalysis = await this.analyzeLLMResponse(message);
				console.log("Análise do LLM:", llmAnalysis);
				return llmAnalysis;
			}
			// Fallback para o método simples quando o LLM não estiver disponível
			console.log("LLM não disponível, usando método simples de identificação");
			return this.identifyToolFromMessage(message);
		} catch (error) {
			console.warn(
				"Erro ao interpretar mensagem, usando ferramenta padrão:",
				error,
			);
			return { toolName: this.defaultToolName, params: { message } };
		}
	}

	/**
	 * Valida os parâmetros contra o schema da ferramenta selecionada
	 * @param toolName - Nome da ferramenta selecionada
	 * @param params - Parâmetros a serem validados
	 * @returns Parâmetros validados ou parâmetros padrão em caso de falha
	 */
	private validateParameters(
		toolName: string,
		params: Record<string, unknown>,
	): Record<string, unknown> {
		const tool = this.availableTools.find((t) => t.name === toolName);

		if (tool?.inputSchema) {
			try {
				const schema = this.createZodSchema(tool.inputSchema);
				return schema.parse(params) as Record<string, unknown>;
			} catch (err) {
				console.warn(
					`Validação de schema falhou para ${toolName}, usando parâmetros padrão`,
				);
				return { message: params.message || "" };
			}
		}

		return params;
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
			// Interpreta a mensagem para determinar qual ferramenta usar
			const { toolName, params } = await this.interpretMessage(message);

			// Valida os parâmetros contra o schema da ferramenta
			const validatedParams = this.validateParameters(toolName, params);

			console.log(
				`Usando ferramenta "${toolName}" com parâmetros:`,
				validatedParams,
			);

			// Chama a ferramenta com os parâmetros interpretados e validados
			const result = await this.client.callTool({
				name: toolName,
				arguments: validatedParams,
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
	 * Fecha a conexão com o servidor MCP e o cliente LLM
	 */
	async close(): Promise<void> {
		if (this.client) {
			await this.client.close();
			this.client = null;
			this.transport = null;
		}

		// Não é necessário fechar o cliente LLM, mas definimos como null
		this.llmClient = null;
	}
}
