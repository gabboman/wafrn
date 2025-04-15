#!/bin/bash

git clone https://github.com/gabboman/wafrn.git && cd wafrn

export JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
export POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"
export ADMIN_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"

cp .env.example .env

sed -i "s#JWT_SECRET=.*#JWT_SECRET=${JWT_SECRET}#" .env
sed -i "s#POSTGRES_PASSWORD=.*#POSTGRES_PASSWORD=${POSTGRES_PASSWORD}#" .env
sed -i "s#ADMIN_PASSWORD=.*#ADMIN_PASSWORD=${ADMIN_PASSWORD}#" .env
