# Use this to delete a user by DID in the system

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "${SCRIPT_DIR}/../../.env"

DID=$1

echo Deleting account with DID $DID

curl \
  --silent \
  --show-error \
  --request POST \
  --user "admin:${PDS_ADMIN_PASSWORD}" \
  --header "Content-Type: application/json" \
  --data "{\"did\": \"$DID\"}" \
  "https://${PDS_DOMAIN_NAME}/xrpc/com.atproto.admin.deleteAccount"

echo
