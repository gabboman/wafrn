# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache perl curl tini bash

WORKDIR /app/packages/frontend

COPY package*.json .

# install dependencies
RUN npm install

COPY . .

# angular.json expects this to be two levels up, so we put it there
RUN ln -s /app/packages/frontend/node_modules /app/node_modules

# copy the frontend environment file
RUN rm -rf src/environments/environment.prod.ts && mv src/environments/environment.docker.ts src/environments/environment.prod.ts

ENV NODE_ENV=production

RUN npm run build

RUN mv dist/wafrn/browser /app/frontend

ARG DOMAIN_NAME
ARG PDS_DOMAIN_NAME
ARG CACHE_DOMAIN
ARG MEDIA_DOMAIN
ARG ACME_EMAIL
ARG DOMAIN_NAME

COPY Caddyfile.example /app/Caddyfile

RUN perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' /app/Caddyfile && \
  perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' /app/Caddyfile

FROM caddy:2

COPY entrypoint.sh /entrypoint.sh
COPY --from=builder /app/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/frontend/ /app/frontend

ENTRYPOINT [ "/entrypoint.sh" ]

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
