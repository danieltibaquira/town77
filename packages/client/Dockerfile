FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/client/package.json packages/client/
RUN pnpm install --frozen-lockfile

COPY packages/shared-types/tsconfig.json packages/shared-types/tsconfig.json
COPY packages/game-engine/tsconfig.json packages/game-engine/tsconfig.json
COPY packages/client/tsconfig.json packages/client/tsconfig.json
COPY packages/client/vite.config.ts packages/client/vite.config.ts
COPY packages/client/index.html packages/client/index.html
COPY packages/shared-types/src packages/shared-types/src
COPY packages/game-engine/src packages/game-engine/src
COPY packages/client/src packages/client/src

RUN pnpm --filter @town77/shared-types run build \
 && pnpm --filter @town77/game-engine run build \
 && pnpm --filter @town77/client run build

FROM nginx:alpine AS production
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
