# syntax=docker/dockerfile:1
FROM node:22-alpine

# create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY tsconfig.json .
COPY prisma ./prisma
COPY src ./src

RUN npm run build

USER appuser

CMD ["node", "dist/app.js"]
