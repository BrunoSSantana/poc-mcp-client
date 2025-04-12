import { ChatApp } from "@app/chat-app.js";
import { ModelConfigManager } from "@app/model-config-manager.js";
import { createAgent } from "@infra/ai/ai-agent-factory.js";
import "dotenv/config";

async function main(): Promise<void> {
  const configManager = new ModelConfigManager();

  try {
    const config = await configManager.configureModel();
    const agent = createAgent(config);
    const chatApp = new ChatApp(agent);
    await chatApp.start();
  } catch (error) {
    console.error("Erro ao iniciar a aplicação:", error);
    process.exit(1);
  } finally {
    configManager.close();
  }
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
