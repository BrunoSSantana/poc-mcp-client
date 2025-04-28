import type { AIAgent } from "@domain/entities/ai-agent.js";
import { AIModelType } from "@domain/entities/ai-model.js";
import { createAgent } from "@infra/ai/ai-agent-factory.js";
import { CliInterface } from "@interface/cli-interface.js";
import { HttpInterface } from "@interface/http-interface.js";
import { ModelConfigManager } from "./model-config-manager.js";

/**
 * Creates an instance of AI agent
 */
export async function createAIAgent(llmModel: AIModelType): Promise<AIAgent> {
  const configManager = new ModelConfigManager();

  try {
    const config = await configManager.configureModel(llmModel);
    return createAgent(config);
  } finally {
    configManager.close();
  }
}

/**
 * Creates a CLI interface with an initialized agent
 */
export async function createCliApp(llmModel: AIModelType): Promise<CliInterface> {
  const agent = await createAIAgent(llmModel);
  const cliInterface = new CliInterface(agent);
  cliInterface.initialize();
  return cliInterface;
}

/**
 * Creates an HTTP interface with an initialized agent
 */
export async function createHttpApp(port = 3000, llmModel: AIModelType): Promise<HttpInterface> {
  const agent = await createAIAgent(llmModel);
  await agent.initialize();

  const httpInterface = new HttpInterface(agent, port);
  await httpInterface.initialize();
  return httpInterface;
}
