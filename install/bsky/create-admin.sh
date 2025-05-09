# Use this to update the admin user in Wafrn to support login to the bsky PDS instance

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "${SCRIPT_DIR}/../../.env"

NEW_USERNAME=${1:-wafrnadmin}

echo Generating new invite code

NEW_CODE=$(docker exec wafrn-pds-1 wget -q -O - --header "Content-Type: application/json" --post-data '{"useCount":1}' http://admin:${PDS_ADMIN_PASSWORD}@localhost:3000/xrpc/com.atproto.server.createInviteCode | jq --raw-output '.code')

echo Invite code genrated: ${NEW_CODE}

PASSWORD=$(openssl rand -base64 24 | tr '+/' '_-')

echo Password generated was "\"$PASSWORD\""

echo Creating admin account

RESULT=$(docker exec wafrn-pds-1 wget -q -O - --header "Content-Type: application/json" --post-data "{\"email\":\"${ADMIN_USER}@${DOMAIN_NAME}\", \"handle\":\"${NEW_USERNAME}.${PDS_DOMAIN_NAME}\", \"password\":\"${PASSWORD}\", \"inviteCode\":\"${NEW_CODE}\"}" http://admin:${PDS_ADMIN_PASSWORD}@localhost:3000/xrpc/com.atproto.server.createAccount)

echo $RESULT

DID="$(echo $RESULT | jq --raw-output '.did')"

echo "Generated DID: ${DID}"

echo "Updating database with details"

docker exec -i wafrn-db-1 psql -d ${POSTGRES_DBNAME} -c "UPDATE users SET \"bskyAuthData\"='${PASSWORD}', \"bskyDid\"='${DID}', \"enableBsky\"=TRUE WHERE url = '${ADMIN_USER}';"
