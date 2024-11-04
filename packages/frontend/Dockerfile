FROM node:bookworm as builder

#RUN apt-get update && apt-get upgrade -y
#RUN apt-get install -y git curl lsb-release wget dialog build-essential ffmpeg webp graphicsmagick tmux sudo

WORKDIR /wafrn
COPY . .
COPY packages/frontend/src/environments/environment.example.ts packages/frontend/src/environments/environment.prod.ts

RUN npm ci && npm run frontend:deploy

FROM caddy:latest

COPY --from=builder /wafrn/packages/frontend/dist/ /usr/local/apache2/htdocs/

