import { MCPConfig } from "@domain/entities"

export type GetMCPServersConfigRepositoryOutput = {
    config: MCPConfig
}

export abstract class GetMCPServersConfigRepository {
    abstract process(): Promise<GetMCPServersConfigRepositoryOutput>
}