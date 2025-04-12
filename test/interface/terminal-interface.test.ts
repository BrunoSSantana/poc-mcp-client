import { TerminalInterface } from "@interface/terminal-interface.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("TerminalInterface", () => {
  // Mock readline
  const mockQuestion = vi.fn();
  const mockClose = vi.fn();

  // Espiona a consola para verificar as saídas
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});

  vi.mock("node:readline", () => ({
    default: {
      createInterface: vi.fn().mockReturnValue({
        question: mockQuestion,
        close: mockClose,
      }),
    },
  }));

  let terminalInterface: TerminalInterface;

  beforeEach(() => {
    terminalInterface = new TerminalInterface();

    // Limpa os mocks entre testes
    mockQuestion.mockReset();
    mockClose.mockReset();
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("print", () => {
    it("should log message to console", () => {
      const message = "Test message";
      terminalInterface.print(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(message);
    });
  });

  describe("printError", () => {
    it("should log error message to console with red color", () => {
      const message = "Test error";
      terminalInterface.printError(message);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`\x1b[31m${message}\x1b[0m`);
    });
  });

  describe("printAIResponse", () => {
    it("should log AI response to console with cyan color", () => {
      const message = "AI response";
      terminalInterface.printAIResponse(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(`\x1b[36m${message}\x1b[0m`);
    });
  });

  describe("input", () => {
    it("should call readline question and return the answer", async () => {
      const prompt = "Enter something:";
      const answer = "User input";

      const readline = terminalInterface as unknown as {
        readline: {
          question: (q: string, cb: (answer: string) => void) => void;
        };
      };
      vi.spyOn(readline.readline, "question").mockImplementation(
        (q: string, cb: (answer: string) => void) => {
          cb(answer);
        },
      );

      const result = await terminalInterface.input(prompt);
      expect(result).toBe(answer);
    });
  });

  describe("close", () => {
    it("should call readline close", () => {
      const readline = terminalInterface as unknown as {
        readline: { close: () => void };
      };
      vi.spyOn(readline.readline, "close");
      terminalInterface.close();
      expect(readline.readline.close).toHaveBeenCalled();
    });
  });

  // Os outros métodos (confirm, selectOption, selectAIModel)
  // dependem do método input que já testamos
  // Se quiséssemos testá-los completamente, precisaríamos de uma implementação mais complexa
  // para simular as chamadas sequenciais
});
