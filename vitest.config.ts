import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["**/node_modules/**", "**/dist/**", "**/test/**", "**/*.d.ts"],
		},
	},
	resolve: {
		alias: {
			"@domain": resolve(__dirname, "./src/domain"),
			"@app": resolve(__dirname, "./src/app"),
			"@interface": resolve(__dirname, "./src/interface"),
			"@infra": resolve(__dirname, "./src/infra"),
			"@": resolve(__dirname, "./src"),
		},
	},
});
