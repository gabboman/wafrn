FROM node:20-bookworm

ARG ADMINUSER=${ADMINUSER}
ARG ADMINEMAIL=${ADMINEMAIL}
ARG ADMINPASSWORD=${ADMINPASSWORD}
ARG JWTSECRET=${JWTSECRET}
ARG MAINDB=${MAINDB}
ARG DBNAME=${DBNAME}
ARG DOMAINNAME=${DOMAINNAME}
ARG PORT=${PORT}
ARG SMTPHOST=${SMTPHOST}
ARG SMTPUSER=${SMTPUSER}
ARG SMTPPORT=${SMTPPORT}
ARG SMTPPASSWORD=${SMTPPASSWORD}
ARG SMTPFROM=${SMTPFROM}
ARG REDISHOST=${REDISHOST}
ARG REDISPORT=${REDISPORT}
ARG FRONTEND_PATH=${FRONTEND_PATH}

ENV ADMINUSER=${ADMINUSER}
ENV ADMINEMAIL=${ADMINEMAIL}
ENV ADMINPASSWORD=${ADMINPASSWORD}
ENV JWTSECRET=${JWTSECRET}
ENV MAINDB=${MAINDB}
ENV DBNAME=${DBNAME}
ENV DOMAINNAME=${DOMAINNAME}
ENV PORT=${PORT}
ENV SMTPHOST=${SMTPHOST}
ENV SMTPUSER=${SMTPUSER}
ENV SMTPPORT=${SMTPPORT}
ENV SMTPPASSWORD=${SMTPPASSWORD}
ENV SMTPFROM=${SMTPFROM}
ENV REDISHOST=${REDISHOST}
ENV REDISPORT=${REDISPORT}
ENV FRONTEND_PATH=${FRONTEND_PATH}

RUN npm i -g @angular/cli pm2 nodemon ts-node

WORKDIR /wafrn
COPY ../.. .
COPY packages/backend/environment.example.ts packages/backend/environment.ts

# to prevent node err: cannot open logs/*.log
RUN mkdir -p packages/backend/logs

# do sed with args here, these really should be envvars instead of doing this
RUN sed -i "s/ADMINUSER/${ADMINUSER}/g" packages/backend/environment.ts && \
  sed -i "s/ADMINEMAIL/${ADMINEMAIL}/g" packages/backend/environment.ts && \
  sed -i "s/ADMINPASSWORD/${ADMINPASSWORD}/g" packages/backend/environment.ts && \
  sed -i "s/JWTSECRET/${JWTSECRET}/g" packages/backend/environment.ts && \
  sed -i "s/MAINDB/${MAINDB}/g" packages/backend/environment.ts && \
  sed -i "s/DBNAME/${DBNAME}/g" packages/backend/environment.ts && \
  sed -i "s/DOMAINNAME/${DOMAINNAME}/g" packages/backend/environment.ts && \
  sed -i "s/APPPORT/${PORT}/g" packages/backend/environment.ts && \
  sed -i "s/SMTPHOST/${SMTPHOST}/g" packages/backend/environment.ts && \
  sed -i "s/SMTPUSER/${SMTPUSER}/g" packages/backend/environment.ts && \
  sed -i "s/SMTPPORT/${SMTPPORT}/g" packages/backend/environment.ts && \
  sed -i "s/SMTPPASSWORD/${SMTPPASSWORD}/g" packages/backend/environment.ts && \
  sed -i "s/SMTPFROM/${SMTPFROM}/g" packages/backend/environment.ts && \
  sed -i "s/REDISHOST/${REDISHOST}/g" packages/backend/environment.ts && \
  sed -i "s/REDISPORT/${REDISPORT}/g" packages/backend/environment.ts && \
  sed -i "s/FRONTEND_PATH/${FRONTEND_PATH}/g" packages/backend/environment.ts

RUN npm ci

ENTRYPOINT [ "npm", "run", "backend:serve"]
