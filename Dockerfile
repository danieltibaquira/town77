FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ && corepack enable pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN pnpm install --frozen-lockfile

COPY packages/shared-types/tsconfig.json packages/shared-types/
COPY packages/game-engine/tsconfig.json packages/game-engine/
COPY packages/server/tsconfig.json packages/server/
COPY packages/client/tsconfig.json packages/client/
COPY packages/client/vite.config.ts packages/client/
COPY packages/client/index.html packages/client/
COPY packages/shared-types/src packages/shared-types/src
COPY packages/game-engine/src packages/game-engine/src
COPY packages/client/src packages/client/src
COPY packages/server/src packages/server/src

RUN pnpm --filter @town77/shared-types run build \
 && pnpm --filter @town77/game-engine run build \
 && pnpm --filter @town77/client run build \
 && pnpm --filter @town77/server run build

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache python3 make g++ && corepack enable pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/server/package.json packages/server/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared-types/dist packages/shared-types/dist
COPY --from=builder /app/packages/game-engine/dist packages/game-engine/dist
COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/packages/client/dist packages/client/dist

ENV NODE_ENV=production
EXPOSE 3077
VOLUME ["/data"]

CMD ["node", "packages/server/dist/index.js"]
