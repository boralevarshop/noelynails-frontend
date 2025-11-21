# 1. Construção (Build)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Desabilita telemetria
ENV NEXT_TELEMETRY_DISABLED=1

# Define a URL da API no build
ENV NEXT_PUBLIC_API_URL=https://api.devhenri.shop

# Gera os arquivos
RUN npm run build

# 2. Produção (Servidor leve)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário de segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# --- CORREÇÃO CRÍTICA AQUI ---
# Isso obriga o Next.js a aceitar conexões de fora do container
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# -----------------------------

CMD ["node", "server.js"]