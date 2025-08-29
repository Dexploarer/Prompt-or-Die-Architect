FROM oven/bun:1.2.21 as base
WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --ci

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]


