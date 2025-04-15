# Build stage
FROM node:20-alpine AS builder

WORKDIR /wafrn

COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/

# install dependencies
RUN npm install

COPY install ./
COPY packages/frontend ./packages/frontend

# copy the frontend environment file
RUN rm -rf packages/frontend/src/environments/environment.prod.ts && mv packages/frontend/src/environments/environment.docker.ts packages/frontend/src/environments/environment.prod.ts

# set node_env as production for the build command
ENV NODE_ENV=production

RUN npm run frontend:build

RUN mv packages/frontend/dist/wafrn/browser/ /wafrn/frontend/

# apache proxy stage
FROM debian:12-slim

# install apache
RUN apt update && apt install -y apache2 apache2-utils tini && apt clean

# enable apache modules
RUN a2enmod proxy && a2enmod proxy_http && a2enmod headers && a2enmod rewrite

RUN mkdir -p /var/www/wafrn

# copy built html files to apache
COPY --from=builder /wafrn/frontend/ /var/www/wafrn/frontend/

# copy the site config
COPY install/apache_files/site.docker.conf site.conf

# read the build args and assign default values
ARG DOMAIN_NAME
ARG BACKEND_URL=${DOMAIN_NAME}
ARG SERVER_NAME=${DOMAIN_NAME}
ARG FRONTEND_URL=${DOMAIN_NAME}
ARG CACHE_URL=${FRONTEND_URL}
ARG MEDIA_URL=${FRONTEND_URL}
ARG ADMIN_CONTACT_EMAIL=admin@${DOMAIN_NAME}

# check if the backend url and frontend url are set and exit build process if not
RUN printenv BACKEND_URL && printenv FRONTEND_URL

# use sed to replace the environment variables in the site file
RUN perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' site.conf && \
  perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' site.conf

# move the site file to the apache sites-enabled directory
RUN mkdir -p /etc/apache2/sites-available && mv site.conf /etc/apache2/sites-available/wafrn.conf

RUN a2dissite 000-default.conf && a2ensite wafrn.conf

EXPOSE 80

# set up tini as entrypoint to be able to handle kernel signals
ENTRYPOINT ["tini", "--"]

# start apache
CMD ["apache2ctl", "-D", "FOREGROUND"]
