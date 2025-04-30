import { createCliApp, createHttpApp } from "@app/app-factory.js";
import { Command } from "commander";
import "dotenv/config";

/**
 * Main entry point for the application
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name("mcp-client")
    .description("MCP Client - Chat with AI models")
    .version("1.0.0");

  program
    .command("cli")
    .description("Run in CLI mode")
    .option("-l --llm <string>", "LLM Model", "claude")
    .action(async (options) => {
      try {
        const cliApp = await createCliApp(options.llm);
        await cliApp.run(['chat']);
      } catch (error) {
        console.error("CLI mode error:", error);
        process.exit(1);
      }
    });

  program
    .command("server")
    .description("Run as HTTP server")
    .option("-p, --port <number>", "Port to listen on", "3000")
    .option("-l --llm <string>", "LLM Model", "claude")
    .action(async (options) => {
      try {
        const port = Number.parseInt(options.port, 10);
        const llmModel = options.llm || "claude";
        console.log(`Starting HTTP server on port ${port} and with `);
        const httpApp = await createHttpApp(port, llmModel);
        await httpApp.start();
      } catch (error) {
        console.error("HTTP server error:", error);
        process.exit(1);
      }
    });

  // Default to CLI mode if no command specified
  if (process.argv.length <= 2) {
    process.argv.push("cli");
  }

  program.parse(process.argv);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
