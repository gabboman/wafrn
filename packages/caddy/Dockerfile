FROM node:20-alpine AS build

RUN apk add --no-cache perl curl tini bash

WORKDIR /app

ARG DOMAIN_NAME
ARG PDS_DOMAIN_NAME
ARG CACHE_DOMAIN
ARG MEDIA_DOMAIN
ARG ACME_EMAIL

COPY Caddyfile.example /app/Caddyfile

RUN perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' /app/Caddyfile && \
  perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' /app/Caddyfile

FROM caddy:2

COPY --from=build /app/Caddyfile /etc/caddy/Caddyfile
