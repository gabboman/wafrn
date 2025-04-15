# Use this to add an invite code to the bluesky integration

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "${SCRIPT_DIR}/../../.env"

NEW_CODE=$(curl \
  --fail \
  --silent \
  --show-error \
  --request POST \
  --user "admin:${PDS_ADMIN_PASSWORD}" \
  --header "Content-Type: application/json" \
  --data '{"useCount": 1}' \
  "https://${PDS_DOMAIN_NAME}/xrpc/com.atproto.server.createInviteCode" | jq --raw-output '.code')

echo Adding code ${NEW_CODE}

docker exec -ti wafrn-db-1 psql -d ${POSTGRES_DBNAME} -c "INSERT INTO \"bskyInviteCodes\" (code,\"createdAt\",\"updatedAt\") VALUES ('${NEW_CODE}',now(),now());"
