FROM node:20-bookworm as builder

WORKDIR /wafrn
COPY . .
COPY packages/frontend/src/environments/environment.example.ts packages/frontend/src/environments/environment.prod.ts

RUN npm ci && npm run frontend:deploy

FROM caddy:latest

COPY --from=builder /wafrn/packages/frontend/dist/ /usr/share/caddy/


