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
echo "Node installed"
npm i -g @angular/cli ts-node pm2 nodemon
npm ci
pm2 install typescript
ts-node install/initialize-db.ts
sed -i "s/forceSync: true/forceSync: false/g" packages/backend/environment.ts
npm run frontend:deploy
pm2 start --name wafrn start.sh
pm2 start --name workers -i max script_workers.sh


