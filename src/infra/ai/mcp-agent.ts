import Anthropic from "@anthropic-ai/sdk";
import type { AIAgent } from "@domain/ai-agent.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import { z } from "zod";

/**
 * Tipo para identificar qual provedor de LLM usar
 */
export type LLMProvider = "anthropic" | "openai";

/**
 * Interface que representa uma ferramenta MCP disponível
 */
interface MCPTool {
	name: string;
	description?: string;
	inputSchema?: Record<string, unknown>;
}

/**
 * Configuração para o provedor OpenAI
 */
interface LLMConfig {
	type: LLMProvider;
	apiKey?: string;
	model?: string;
}

/**
 * Configuração para o MCP Client
 */
interface MCPClientConfig {
	command: string;
	args: string[];
}

/**
 * Interface que representa um provedor de LLM
 */
abstract class LLMService {
	abstract isInitialized(): boolean;
	abstract initialize(): Promise<void>;
	abstract analyzeUserIntent(
		message: string,
		tools: MCPTool[],
		defaultToolName: string,
	): Promise<ToolSelectionResult>;
	abstract generateResponse(
		userMessage: string,
		toolName: string,
		mcpResponse: unknown,
	): Promise<string>;
	abstract close(): void;
}

/**
 * Resultado da análise de intenção do usuário
 */
type ToolSelectionResult = {
	toolName: string;
	params: Record<string, unknown>;
};

/**
 * Implementação base abstrata para serviços de LLM
 */
abstract class BaseLLMService implements LLMService {
	protected apiKey: string;
	protected model: string;

	constructor(apiKey: string, model: string) {
		this.apiKey = apiKey;
		this.model = model;
	}

	abstract isInitialized(): boolean;
	abstract initialize(): Promise<void>;
	abstract analyzeUserIntent(
		message: string,
		tools: MCPTool[],
		defaultToolName: string,
	): Promise<ToolSelectionResult>;
	abstract generateResponse(
		userMessage: string,
		toolName: string,
		mcpResponse: unknown,
	): Promise<string>;
	abstract close(): void;

	/**
	 * Gera um prompt para o LLM que descreve as ferramentas disponíveis e pede para analisar a mensagem do usuário
	 */
	protected generateToolSelectionPrompt(
		userMessage: string,
		tools: MCPTool[],
		defaultToolName: string,
	): string {
		const toolsDescription = tools
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

Se nenhuma ferramenta específica for mencionada ou se a intenção não estiver clara, use a ferramenta padrão "${defaultToolName}" com a mensagem completa como parâmetro.
`;
	}

	/**
	 * Gera um prompt para contextualizar a resposta da ferramenta MCP com a pergunta do usuário
	 */
	protected generateContextualResponsePrompt(
		userMessage: string,
		toolName: string,
		mcpResponse: unknown,
	): string {
		const responseStr =
			typeof mcpResponse === "object"
				? JSON.stringify(mcpResponse, null, 2)
				: String(mcpResponse);

		return `
Você é um assistente especializado em criar respostas claras e úteis baseadas em dados.

Pergunta do usuário: "${userMessage}"

Para responder à pergunta, uma ferramenta chamada "${toolName}" foi utilizada, e retornou os seguintes dados:
---
${responseStr}
---

Por favor, crie uma resposta útil, clara e natural para o usuário, baseada nesses dados. 
Sua resposta deve:
1. Abordar diretamente a pergunta ou solicitação original do usuário
2. Usar as informações fornecidas pela ferramenta para fundamentar sua resposta
3. Ser concisa e direta, evitando explicações desnecessárias sobre como a informação foi obtida
4. Ter um tom conversacional e útil

Se os dados não forem suficientes para responder completamente à pergunta, indique o que você pode responder com base nos dados disponíveis e o que está faltando.
`;
	}
}

/**
 * Implementação do serviço LLM usando OpenAI
 */
class OpenAIService extends BaseLLMService {
	private client: OpenAI | null = null;

	constructor(apiKey: string, model = "gpt-4o") {
		super(apiKey, model);
	}

	isInitialized(): boolean {
		return this.client !== null;
	}

	async initialize(): Promise<void> {
		if (this.apiKey) {
			this.client = new OpenAI({
				apiKey: this.apiKey,
			});
		} else {
			throw new Error("OpenAI API key is required");
		}
	}

	async analyzeUserIntent(
		message: string,
		tools: MCPTool[],
		defaultToolName: string,
	): Promise<ToolSelectionResult> {
		if (!this.client) {
			throw new Error("OpenAI client not initialized");
		}

		try {
			const prompt = this.generateToolSelectionPrompt(
				message,
				tools,
				defaultToolName,
			);

			const response = await this.client.chat.completions.create({
				model: this.model,
				messages: [
					{
						role: "system",
						content:
							"Você é um assistente especializado em NLP, focado em extrair a intenção do usuário e mapear para ferramentas de API específicas. Responda apenas com o formato JSON solicitado.",
					},
					{ role: "user", content: prompt },
				],
				response_format: { type: "json_object" },
			});

			// Verificando e extraindo o texto da resposta de forma segura
			if (!response.choices[0]?.message?.content) {
				throw new Error("Formato de resposta do OpenAI inesperado");
			}

			const jsonString = response.choices[0].message.content.trim();
			const result = JSON.parse(jsonString);

			// Verificar se o resultado contém os campos esperados
			if (!result.toolName || !result.parameters) {
				throw new Error("Resposta do OpenAI não contém os campos necessários");
			}

			// Verificar se a ferramenta selecionada existe
			if (!tools.some((tool) => tool.name === result.toolName)) {
				console.warn(
					`Ferramenta "${result.toolName}" selecionada pelo OpenAI não existe. Usando ferramenta padrão.`,
				);
				return {
					toolName: defaultToolName,
					params: { message },
				};
			}

			return {
				toolName: result.toolName,
				params: result.parameters,
			};
		} catch (error) {
			console.warn("Erro ao analisar resposta do OpenAI:", error);
			return {
				toolName: defaultToolName,
				params: { message },
			};
		}
	}

	async generateResponse(
		userMessage: string,
		toolName: string,
		mcpResponse: unknown,
	): Promise<string> {
		if (!this.client) {
			throw new Error("OpenAI client not initialized");
		}

		try {
			const prompt = this.generateContextualResponsePrompt(
				userMessage,
				toolName,
				mcpResponse,
			);

			const response = await this.client.chat.completions.create({
				model: this.model,
				messages: [
					{
						role: "system",
						content:
							"Você é um assistente útil que fornece respostas claras e diretas baseadas em dados.",
					},
					{ role: "user", content: prompt },
				],
			});

			// Verificando e extraindo o texto da resposta de forma segura
			if (!response.choices[0]?.message?.content) {
				throw new Error("Formato de resposta do OpenAI inesperado");
			}

			return response.choices[0].message.content.trim();
		} catch (error) {
			console.warn("Erro ao gerar resposta contextualizada com OpenAI:", error);
			return `Não foi possível elaborar uma resposta contextualizada. Aqui estão os dados brutos: ${JSON.stringify(mcpResponse)}`;
		}
	}

	close(): void {
		this.client = null;
	}
}

/**
 * Implementação do serviço LLM usando Anthropic
 */
class AnthropicService extends BaseLLMService {
	private client: Anthropic | null = null;

	constructor(apiKey: string, model = "claude-3-5-sonnet-20241022") {
		super(apiKey, model);
	}

	isInitialized(): boolean {
		return this.client !== null;
	}

	async initialize(): Promise<void> {
		if (this.apiKey) {
			this.client = new Anthropic({
				apiKey: this.apiKey,
			});
		} else {
			throw new Error("Anthropic API key is required");
		}
	}

	async analyzeUserIntent(
		message: string,
		tools: MCPTool[],
		defaultToolName: string,
	): Promise<ToolSelectionResult> {
		if (!this.client) {
			throw new Error("Anthropic client not initialized");
		}

		try {
			const prompt = this.generateToolSelectionPrompt(
				message,
				tools,
				defaultToolName,
			);

			const response = await this.client.messages.create({
				model: this.model,
				max_tokens: 1000,
				system:
					"Você é um assistente especializado em NLP, focado em extrair a intenção do usuário e mapear para ferramentas de API específicas. Responda apenas com o formato JSON solicitado.",
				messages: [{ role: "user", content: prompt }],
			});

			// Verificando e extraindo o texto da resposta de forma segura
			if (!response.content[0] || !("text" in response.content[0])) {
				throw new Error("Formato de resposta do Anthropic inesperado");
			}

			const responseText = response.content[0].text.trim();
			const jsonMatch =
				responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
				responseText.match(/\{[\s\S]*\}/);

			if (!jsonMatch) {
				throw new Error(
					"Não foi possível extrair um JSON válido da resposta do Anthropic",
				);
			}

			const jsonString = jsonMatch[0].replace(/```json|```/g, "").trim();
			const result = JSON.parse(jsonString);

			// Verificar se o resultado contém os campos esperados
			if (!result.toolName || !result.parameters) {
				throw new Error(
					"Resposta do Anthropic não contém os campos necessários",
				);
			}

			// Verificar se a ferramenta selecionada existe
			if (!tools.some((tool) => tool.name === result.toolName)) {
				console.warn(
					`Ferramenta "${result.toolName}" selecionada pelo Anthropic não existe. Usando ferramenta padrão.`,
				);
				return {
					toolName: defaultToolName,
					params: { message },
				};
			}

			return {
				toolName: result.toolName,
				params: result.parameters,
			};
		} catch (error) {
			console.warn("Erro ao analisar resposta do Anthropic:", error);
			return {
				toolName: defaultToolName,
				params: { message },
			};
		}
	}

	async generateResponse(
		userMessage: string,
		toolName: string,
		mcpResponse: unknown,
	): Promise<string> {
		if (!this.client) {
			throw new Error("Anthropic client not initialized");
		}

		try {
			const prompt = this.generateContextualResponsePrompt(
				userMessage,
				toolName,
				mcpResponse,
			);

			const response = await this.client.messages.create({
				model: this.model,
				max_tokens: 1000,
				system:
					"Você é um assistente útil que fornece respostas claras e diretas baseadas em dados.",
				messages: [{ role: "user", content: prompt }],
			});

			// Verificando e extraindo o texto da resposta de forma segura
			if (!response.content[0] || !("text" in response.content[0])) {
				throw new Error("Formato de resposta do Anthropic inesperado");
			}

			return response.content[0].text.trim();
		} catch (error) {
			console.warn(
				"Erro ao gerar resposta contextualizada com Anthropic:",
				error,
			);
			return `Não foi possível elaborar uma resposta contextualizada. Aqui estão os dados brutos: ${JSON.stringify(mcpResponse)}`;
		}
	}

	close(): void {
		this.client = null;
	}
}

/**
 * Implementação simples para casos sem LLM
 */
class SimpleIntentService implements LLMService {
	private initialized = true;

	isInitialized(): boolean {
		return this.initialized;
	}

	async initialize(): Promise<void> {
		// Não há inicialização necessária
	}

	async analyzeUserIntent(
		message: string,
		tools: MCPTool[],
		defaultToolName: string,
	): Promise<ToolSelectionResult> {
		// Exemplo simples: verifica se a mensagem menciona explicitamente uma ferramenta
		let toolName = defaultToolName;
		const params: Record<string, unknown> = { message };

		for (const tool of tools) {
			if (message.toLowerCase().includes(`use ${tool.name.toLowerCase()}`)) {
				toolName = tool.name;
				break;
			}
		}

		return { toolName, params };
	}

	async generateResponse(
		userMessage: string,
		toolName: string,
		mcpResponse: unknown,
	): Promise<string> {
		// Retorna apenas os dados brutos
		return typeof mcpResponse === "object"
			? JSON.stringify(mcpResponse, null, 2)
			: String(mcpResponse);
	}

	close(): void {
		// Não há necessidade de fechar
	}
}

/**
 * Serviço de validação de parâmetros usando Zod
 */
class SchemaValidator {
	/**
	 * Cria um schema Zod a partir de um schema JSON
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
	 * Valida os parâmetros contra o schema da ferramenta
	 */
	validateParameters(
		tool: MCPTool | undefined,
		params: Record<string, unknown>,
	): Record<string, unknown> {
		if (tool?.inputSchema) {
			try {
				const schema = this.createZodSchema(tool.inputSchema);
				return schema.parse(params) as Record<string, unknown>;
			} catch (err) {
				console.warn(
					`Validação de schema falhou para ${tool.name}, usando parâmetros padrão`,
				);
				return { message: params.message || "" };
			}
		}

		return params;
	}
}

/**
 * Cria um serviço LLM com base na configuração fornecida
 */
function createLLMService(config: LLMConfig): LLMService {
	if (config.type === "openai") {
		return new OpenAIService(
			config.apiKey || process.env.OPENAI_API_KEY || "",
			config.model,
		);
	}

	if (config.type === "anthropic") {
		return new AnthropicService(
			config.apiKey || process.env.ANTHROPIC_API_KEY || "",
			config.model,
		);
	}

	// Fallback para serviço simples
	return new SimpleIntentService();
}

/**
 * Implementação do agente de IA utilizando o Model Context Protocol
 */
export class MCPAgent implements AIAgent {
	private client: Client | null = null;
	private transport: StdioClientTransport | null = null;
	private readonly mcpConfig: MCPClientConfig;
	private readonly defaultToolName: string;
	private availableTools: MCPTool[] = [];
	private readonly llmService: LLMService;
	private readonly validator: SchemaValidator;

	/**
	 * Cria uma instância do agente MCP
	 * @param config - Configuração para o MCP (opcional, usa valores padrão se não fornecida)
	 * @param defaultToolName - Nome da ferramenta padrão a ser usada (opcional, usa 'get_employees' por padrão)
	 * @param llmConfig - Configuração para o LLM utilizado na interpretação de mensagens
	 */
	constructor(
		config?: MCPClientConfig,
		defaultToolName = "get_employees",
		llmConfig: LLMConfig = { type: "anthropic" },
	) {
		this.mcpConfig = config || {
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
		this.llmService = createLLMService(llmConfig);
		this.validator = new SchemaValidator();
	}

	/**
	 * Inicializa o cliente MCP e o cliente LLM
	 */
	async initialize(): Promise<void> {
		try {
			// Inicializa o cliente MCP
			this.transport = new StdioClientTransport(this.mcpConfig);

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

			// Inicializa o serviço LLM
			try {
				await this.llmService.initialize();
				console.log("Serviço LLM inicializado com sucesso.");
			} catch (error) {
				console.warn(
					`Aviso: Não foi possível inicializar o serviço LLM: ${(error as Error).message}`,
				);
				console.warn(
					"Será utilizado um método simples para interpretação de mensagens.",
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
	 * Interpreta a mensagem do usuário para determinar qual ferramenta usar
	 */
	private async interpretMessage(
		message: string,
	): Promise<{ toolName: string; params: Record<string, unknown> }> {
		if (!this.client) {
			throw new Error("MCP client not initialized");
		}

		try {
			// Analisa a intenção do usuário usando o serviço LLM
			return await this.llmService.analyzeUserIntent(
				message,
				this.availableTools,
				this.defaultToolName,
			);
		} catch (error) {
			console.warn(
				"Erro ao interpretar mensagem, usando ferramenta padrão:",
				error,
			);
			return { toolName: this.defaultToolName, params: { message } };
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

		console.log("Enviando mensagem para o MCP:", message);
		try {
			// Interpreta a mensagem para determinar qual ferramenta usar
			const { toolName, params } = await this.interpretMessage(message);
			console.log("Ferramenta selecionada:", toolName);
			console.log("Parâmetros:", params);

			// Encontra a ferramenta selecionada
			const selectedTool = this.availableTools.find((t) => t.name === toolName);

			// Valida os parâmetros contra o schema da ferramenta
			const validatedParams = this.validator.validateParameters(
				selectedTool,
				params,
			);
			console.log("Parâmetros validados:", validatedParams);

			// Chama a ferramenta com os parâmetros interpretados e validados
			const result = await this.client.callTool({
				name: toolName,
				arguments: validatedParams,
			});

			// Processa a resposta do MCP usando LLM para criar uma resposta contextualizada
			return await this.llmService.generateResponse(message, toolName, result);
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

		// Fecha o serviço LLM
		this.llmService.close();
	}
}
