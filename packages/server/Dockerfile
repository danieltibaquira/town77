FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ && corepack enable pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile

COPY packages/shared-types/tsconfig.json packages/shared-types/tsconfig.json
COPY packages/game-engine/tsconfig.json packages/game-engine/tsconfig.json
COPY packages/server/tsconfig.json packages/server/tsconfig.json
COPY packages/shared-types/src packages/shared-types/src
COPY packages/game-engine/src packages/game-engine/src
COPY packages/server/src packages/server/src
RUN pnpm --filter @town77/shared-types run build \
 && pnpm --filter @town77/game-engine run build \
 && pnpm --filter @town77/server run build

# Test stage: runs the server suite in-container (Constitution rule 1 —
# reproducible, no host-only test execution). Reuses the builder, which already
# has devDeps (vitest) and a source-built better-sqlite3 native binding.
FROM builder AS test
ENV NODE_ENV=test
CMD ["pnpm", "--filter", "@town77/server", "run", "test"]

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

ENV NODE_ENV=production
EXPOSE 3001
VOLUME ["/data"]

CMD ["node", "packages/server/dist/index.js"]
