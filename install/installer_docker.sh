#!/bin/bash

git clone https://github.com/gabboman/wafrn.git && cd wafrn

export JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
export POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"
export ADMIN_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"
export PDS_JWT_SECRET="$(openssl rand --hex 16)"
export PDS_ADMIN_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"
export PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX="$(openssl ecparam --name secp256k1 --genkey --noout --outform DER | tail --bytes=+8 | head --bytes=32 | xxd --plain --cols 32)"

cp .env.example .env

sed -i "s#JWT_SECRET=.*#JWT_SECRET=${JWT_SECRET}#" .env
sed -i "s#POSTGRES_PASSWORD=.*#POSTGRES_PASSWORD=${POSTGRES_PASSWORD}#" .env
sed -i "s#ADMIN_PASSWORD=.*#ADMIN_PASSWORD=${ADMIN_PASSWORD}#" .env
sed -i "s#PDS_JWT_SECRET=.*#PDS_JWT_SECRET=${PDS_JWT_SECRET}#" .env
sed -i "s#PDS_ADMIN_PASSWORD=.*#PDS_ADMIN_PASSWORD=${PDS_ADMIN_PASSWORD}#" .env
sed -i "s#PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX=.*#PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX=${PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX}#" .env
