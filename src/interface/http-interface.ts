import type { AIAgent } from "@domain/entities/ai-agent.js";
import cors from "@fastify/cors";
import fastify, { type FastifyInstance } from "fastify";

/**
 * Interface for HTTP interaction using Fastify
 */
export class HttpInterface {
  private server: FastifyInstance;
  private readonly port: number;

  /**
   * Creates an HTTP interface instance
   */
  constructor(
    private readonly agent: AIAgent,
    port = 3000,
  ) {
    this.port = port;
    this.server = fastify({
      logger: true,
    });
  }

  /**
   * Initializes the HTTP server with routes and plugins
   */
  async initialize(): Promise<void> {
    // Register CORS plugin
    await this.server.register(cors, {
      origin: true,
    });

    // Health check endpoint
    this.server.get("/health", async () => {
      return { status: "ok" };
    });

    // Chat endpoint
    this.server.post("/chat", async (request, reply) => {
      const { message } = request.body as { message: string };

      if (!message) {
        reply.code(400);
        return { error: "Message is required" };
      }

      try {
        const answer = await this.agent.sendMessage(message);
        return { answer };
      } catch (error) {
        request.log.error(error);
        reply.code(500);
        return {
          error: `Error processing message: ${(error as Error).message}`,
        };
      }
    });
  }

  /**
   * Starts the HTTP server
   */
  async start(): Promise<void> {
    try {
      await this.server.listen({ port: this.port, host: "0.0.0.0" });
      console.log(`HTTP server listening on port ${this.port}`);
    } catch (err) {
      this.server.log.error(err);
      throw err;
    }
  }

  /**
   * Closes the HTTP server
   */
  async close(): Promise<void> {
    await this.server.close();
  }
}
