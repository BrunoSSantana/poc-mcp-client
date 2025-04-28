FROM node:22.15.0-alpine3.20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copiar os arquivos de configuração
COPY package.json pnpm-lock.yaml ./
COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
COPY mcp.json ./mcp.json

# Ajustar permissões do script de entrada
RUN chmod +x /docker-entrypoint.sh

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22.15.0-alpine3.20 AS production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV MCP_CONFIG_PATH=/app/mcp.json

# Copiar arquivos e dependências
COPY --from=base /docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=base /app/mcp.json ./mcp.json
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist ./dist

# Expor a porta
EXPOSE 3000

# Definir o ponto de entrada
ENTRYPOINT ["/docker-entrypoint.sh"]

# Comando padrão
CMD ["server"] 