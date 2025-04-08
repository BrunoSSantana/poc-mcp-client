import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
	// Create an MCP client instance

	try {
		// Create a transport
		console.log("Creating transport...");
		const transport = new StdioClientTransport({
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
		});
		console.log("Transport created");

		transport.onerror = (error) => {
			console.error("Transport error:", error);
			throw new Error("Transport error");
		};

		const client = new Client(
			{ name: "example-client", version: "1.0.0" },
			{ capabilities: { tools: {}, resources: {}, prompts: {} } },
		);

		try {
			// Connect to the server
			console.log("Connecting to server...");
			await client.connect(transport);
		} catch (error) {
			console.error("Error connecting to server:", error);
			throw new Error("Error connecting to server");
		}

		// Initialize the connection
		console.log("Initializing connection...");

		// Discover List of Tools
		const tools = await client.listTools();
		console.log("Available tools:", JSON.stringify(tools.tools));

		/* 		const resources = await client.listResources();
		console.log("Available resources:", resources.resources);
		console.log("Available resource templates:", resources.resourceTemplates); */

		/* 		const prompts = await client.listPrompts();
		console.log("Available prompts:", prompts.prompts); */

		// If the server has an 'echo' tool, call it
		console.log("");
		if (tools.tools.some((tool) => tool.name === "get_employees")) {
			console.log("Calling get_employees tool...");
			const result = await client.callTool({
				name: "get_employees",
				arguments: { message: "Hello, World!" },
			});
			console.log(
				"get_employees result:",
				typeof result === "object" ? JSON.stringify(result) : String(result),
			);
		}

		// Close the connection
		await client.close();
		console.log("Connection closed");
	} catch (error) {
		console.error("Error:", error);
	}
}

main();
