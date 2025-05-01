#!/bin/bash

# run this file from WAFRN root directory, e.g.
#
# $ ./install/env_secret_setup.sh

export JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
export POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"
export PDS_JWT_SECRET="$(openssl rand --hex 16)"
export PDS_ADMIN_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"
export PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX="$(openssl ecparam --name secp256k1 --genkey --noout --outform DER | tail --bytes=+8 | head --bytes=32 | xxd --plain --cols 32)"

# this might be set earlier
if [ -z "${ADMIN_PASSWORD}" ]; then
  export ADMIN_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"
fi


cp .env.example .env

perl -pi -e 's/^([_A-Z0-9]+)=(.*)$/$1."='"'"'".($ENV{$1}||$2)."'"'"'"/ge' .env
