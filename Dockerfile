# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base

WORKDIR /app

ENV NODE_ENV=development \
    PNPM_HOME=/root/.local/share/pnpm

ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

RUN apk add --no-cache openssl

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY server.ts ./
COPY modules ./modules
COPY scripts ./scripts
COPY prisma ./prisma
COPY rest-client ./rest-client
COPY doc ./doc

CMD ["pnpm", "dev"]
