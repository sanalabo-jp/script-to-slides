FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV ADAPTER=node
RUN npm run build

FROM node:22-slim AS production
WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

USER app
CMD ["node", "build"]
