# Build stage
FROM node:24-alpine AS build

# include important binaries
RUN apk add --no-cache perl curl tini bash ffmpeg

# set working directory
WORKDIR /wafrn

# copy package.json and package-lock.json
COPY package*.json ./

# set node_env as production for the npm install command
ENV NODE_ENV=production

# install dependencies
RUN npm install

# copy the rest of the files
COPY . .

# create log folder early to prevent node err: cannot open logs/*.log
RUN mkdir -p logs

# read the build args and set the environment variables with them
ARG ADMIN_USER
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD
ARG JWT_SECRET
ARG DOMAIN_NAME
ARG CACHE_DOMAIN
ARG MEDIA_DOMAIN

ARG POSTGRES_PASSWORD
ARG POSTGRES_USER
ARG POSTGRES_DBNAME

ARG SMTP_HOST
ARG SMTP_USER
ARG SMTP_PORT
ARG SMTP_PASSWORD
ARG SMTP_FROM

ARG ENABLE_BSKY
ARG PDS_DOMAIN_NAME
ARG PDS_JWT_SECRET
ARG PDS_ADMIN_PASSWORD

ARG LOG_SQL_QUERIES
ARG UPLOAD_LIMIT
ARG POSTS_PER_PAGE
ARG LOG_LEVEL
ARG BLOCKLIST_URI
ARG FRONTEND_PATH
ARG DISABLE_REQUIRE_SEND_EMAIL
ARG BLOCKED_IPS
ARG REVIEW_REGISTRATIONS
ARG IGNORE_BLOCK_HOSTS

ARG USE_WORKERS
ARG WORKERS_LOW
ARG WORKERS_MEDIUM
ARG WORKERS_HIGH

ARG WEBPUSH_EMAIL
ARG WEBPUSH_PRIVATE
ARG WEBPUSH_PUBLIC
ARG FRONTEND_LOGO
ARG FRONTEND_API_URL
ARG FRONTEND_MEDIA_URL
ARG FRONTEND_CACHE_URL
ARG FRONTEND_CACHE_BACKUP_URLS
ARG FRONTEND_SHORTEN_POSTS
ARG FRONTEND_DISABLE_PWA
ARG FRONTEND_MAINTENANCE

# defaults assuming this is run in the docker compose package with the others
ARG FRONTEND_FQDN_URL=https://${DOMAIN_NAME}
ARG POSTGRES_HOST=db
ARG POSTGRES_PORT=5432
ARG REDIS_HOST=redis
ARG REDIS_PORT=6379
ARG LISTEN_IP=0.0.0.0
ARG PORT=9000
ARG LOG_DESTINATION=1


COPY environment.example.ts environment.ts

# use sed to replace the environment variables in the environment.ts file
RUN perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' environment.ts && \
  perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' environment.ts

#RUN npm run type-check

# expose port from environment.ts
EXPOSE ${PORT}

# set up tini as entrypoint to be able to handle kernel signals
ENTRYPOINT ["tini", "--"]

# start the actual backend server
CMD ["npm", "start"]
