FROM node:20-bookworm as builder

ARG DOMAINNAME=${DOMAINNAME}
ENV DOMAINNAME=${DOMAINNAME}

RUN npm i -g @angular/cli pm2 nodemon ts-node
WORKDIR /wafrn
COPY ../.. .
COPY packages/frontend/src/environments/environment.example.ts packages/frontend/src/environments/environment.prod.ts

RUN npm install && npm ci && npm run frontend:deploy

FROM caddy:latest

COPY packages/frontend/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /wafrn/frontend/ /var/www/html/

