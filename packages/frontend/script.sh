#!/bin/sh
while true; do
  git pull origin main
  npm run build:ssr
  npm run serve:ssr
done
