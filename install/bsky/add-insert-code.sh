#!/bin/bash

# Use this to add an invite code to the bluesky integration

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "${SCRIPT_DIR}/../../.env"

NEW_CODE=$(docker exec wafrn-pds-1 wget -q -O - --header "Content-Type: application/json" --post-data '{"useCount":1}' http://admin:${PDS_ADMIN_PASSWORD}@localhost:3000/xrpc/com.atproto.server.createInviteCode | jq --raw-output '.code')

echo Adding code ${NEW_CODE}

docker exec -i wafrn-db-1 psql -d ${POSTGRES_DBNAME} -c "INSERT INTO \"bskyInviteCodes\" (code,\"createdAt\",\"updatedAt\") VALUES ('${NEW_CODE}',now(),now());"
