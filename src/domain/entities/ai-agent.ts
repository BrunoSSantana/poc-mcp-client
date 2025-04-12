/**
 * Interface que define o contrato para diferentes implementações de agentes de IA
 */
export interface AIAgent {
  /**
   * Envia uma mensagem para o agente de IA e retorna sua resposta
   * @param message - Mensagem do usuário
   * @returns Promessa que resolve para a resposta do agente
   */
  sendMessage(message: string): Promise<string>;

  /**
   * Inicializa o agente de IA
   * @returns Promessa que resolve quando o agente estiver pronto
   */
  initialize(): Promise<void>;

  /**
   * Finaliza a conexão com o agente de IA
   * @returns Promessa que resolve quando a conexão for encerrada
   */
  close(): Promise<void>;
}
