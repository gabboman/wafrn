# Build stage
FROM node:20-alpine AS build

# include important binaries
RUN apk add --no-cache curl tini bash

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
ARG ADMINUSER
ARG ADMINEMAIL
ARG ADMINPASSWORD
ARG JWTSECRET
ARG MAINDB
ARG DBNAME
ARG DOMAINNAME
ARG PORT
ARG SMTPHOST
ARG SMTPUSER
ARG SMTPPORT
ARG SMTPPASSWORD
ARG SMTPFROM
ARG REDISHOST
ARG REDISPORT
ARG LOG_SQL_QUERIES=false
ARG FRONTEND_PATH
ARG FRONTEND_LOGO="\\/assets\\/logo.png"
ARG FRONTEND_SHORTEN_POSTS=3
ARG FRONTEND_DISABLE_PWA=false
ARG FRONTEND_MAINTENANCE=false
ARG FRONTEND_URL="localhost:9992"
ARG FRONTEND_API_URL="\\/api"
ARG FRONTEND_CACHE_URL="\\/api\\/cache?media="
ARG FRONTEND_MEDIA_URL="\\/api\/uploads"

COPY environment.example.ts environment.ts

# use sed to replace the environment variables in the environment.ts file
RUN sed -i "s/LOG_SQL_QUERIES/${LOG_SQL_QUERIES}/g" environment.ts && \
  sed -i "s/ADMINUSER/${ADMINUSER}/g" environment.ts && \
  sed -i "s/ADMINEMAIL/${ADMINEMAIL}/g" environment.ts && \
  sed -i "s/ADMINPASSWORD/${ADMINPASSWORD}/g" environment.ts && \
  sed -i "s/JWTSECRET/${JWTSECRET}/g" environment.ts && \
  sed -i "s/MAINDB/${MAINDB}/g" environment.ts && \
  sed -i "s/DBNAME/${DBNAME}/g" environment.ts && \
  sed -i "s/DOMAINNAME/${DOMAINNAME}/g" environment.ts && \
  sed -i "s/APPPORT/${PORT}/g" environment.ts && \
  sed -i "s/SMTPHOST/${SMTPHOST}/g" environment.ts && \
  sed -i "s/SMTPUSER/${SMTPUSER}/g" environment.ts && \
  sed -i "s/SMTPPORT/${SMTPPORT}/g" environment.ts && \
  sed -i "s/SMTPPASSWORD/${SMTPPASSWORD}/g" environment.ts && \
  sed -i "s/SMTPFROM/${SMTPFROM}/g" environment.ts && \
  sed -i "s/REDISHOST/${REDISHOST}/g" environment.ts && \
  sed -i "s/REDISPORT/${REDISPORT}/g" environment.ts && \
  sed -i "s/FRONTEND_PATH/${FRONTEND_PATH}/g" environment.ts && \
  sed -i "s/FRONTEND_LOGO/${FRONTEND_LOGO}/g" environment.ts && \
  sed -i "s/FRONTEND_SHORTEN_POSTS/${FRONTEND_SHORTEN_POSTS}/g" environment.ts && \
  sed -i "s/FRONTEND_DISABLE_PWA/${FRONTEND_DISABLE_PWA}/g" environment.ts && \
  sed -i "s/FRONTEND_MAINTENANCE/${FRONTEND_MAINTENANCE}/g" environment.ts && \
  sed -i "s/FRONTEND_URL/${FRONTEND_URL}/g" environment.ts && \
  sed -i "s/FRONTEND_API_URL/${FRONTEND_API_URL}/g" environment.ts && \
  sed -i "s/FRONTEND_CACHE_URL/${FRONTEND_CACHE_URL}/g" environment.ts && \
  sed -i "s/FRONTEND_MEDIA_URL/${FRONTEND_MEDIA_URL}/g" environment.ts

# expose port from environment.ts
EXPOSE ${PORT}

# set up tini as entrypoint to be able to handle kernel signals
ENTRYPOINT ["tini", "--"]

# start the actual backend server
CMD ["npm", "start"]
