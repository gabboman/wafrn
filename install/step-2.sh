#!/bin/bash
if [ $(id -u) -e 0 ]; then
  echo Please run this script NOT as sudo, but the wafrn user
  exit
fi

echo "We are going to install NVM and the recommended node version into your user"

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

nvm install 20
echo "Node installed"
npm i -g @angular/cli pm2 nodemon
npm ci
npm run frontend:deploy
