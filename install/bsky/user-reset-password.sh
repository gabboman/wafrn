#!/bin/bash

# Use this to delete a user by DID in the system

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "${SCRIPT_DIR}/../../.env"

DID=$1

echo Resetting password for account with DID $DID

PASSWORD=$(openssl rand -base64 24 | tr '+/' '_-')

echo Password generated was "\"$PASSWORD\""

curl \
  --silent \
  --show-error \
  --request POST \
  --user "admin:${PDS_ADMIN_PASSWORD}" \
  --header "Content-Type: application/json" \
  --data "{ \"did\": \"${DID}\", \"password\": \"${PASSWORD}\" }" \
  "https://${PDS_DOMAIN_NAME}/xrpc/com.atproto.admin.updateAccountPassword"

echo

echo "Updating database with new password"

docker exec -ti wafrn-db-1 psql -d ${POSTGRES_DBNAME} -c "UPDATE users SET \"bskyAuthData\"='${PASSWORD}' WHERE \"bskyDid\"='${DID}';"
