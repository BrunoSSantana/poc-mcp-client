import "dotenv/config";
import { ChatApp } from "@app/chat-app.js";

async function main(): Promise<void> {
	try {
		const chatApp = new ChatApp();
		await chatApp.start();
	} catch (error) {
		console.error("Erro ao iniciar a aplicação:", error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("Erro fatal:", error);
	process.exit(1);
});
