FROM cybertecpostgresql/pgwatch:latest

ARG POSTGRES_USER
ARG POSTGRES_DB
ARG POSTGRES_PASSWORD

RUN apk add --no-cache perl curl tini bash

COPY sources.yaml /sources.yaml

RUN perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' /sources.yaml && \
  perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' /sources.yaml
