#!/bin/bash
if [ `id -u` -e 0 ]
  then echo Please run this script NOT as sudo, but the wafrn user
  exit
fi

echo "We are going to install NVM and the recomended node version into your user"

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 22
npm i -g @angular/cli ts-node pm2 nodemon
npm ci
npm run frontend:deploy
echo "next step run it as the wafrn user and with ts-node"
echo "the command would be"
echo "ts-node step-3-run-as-regular-user-with-ts-node.ts"


