# Use this to list all users to get the DID if you want to delete someone

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "${SCRIPT_DIR}/../../.env"

echo Listing accounts

DIDS="$(curl \
  --fail \
  --silent \
  --show-error \
  --user "admin:${PDS_ADMIN_PASSWORD}" \
  --header "Content-Type: application/json" \
  "https://${PDS_DOMAIN_NAME}/xrpc/com.atproto.sync.listRepos?limit=100" | jq --raw-output '.repos[].did'
)"

OUTPUT='[{"handle":"Handle","email":"Email","did":"DID"}'

for did in ${DIDS}; do
  ITEM="$(curl \
    --fail \
    --silent \
    --show-error \
    --user "admin:${PDS_ADMIN_PASSWORD}" \
    --header "Content-Type: application/json" \
    "https://${PDS_DOMAIN_NAME}/xrpc/com.atproto.admin.getAccountInfo?did=${did}"
  )"
  OUTPUT="${OUTPUT},${ITEM}"
done
OUTPUT="${OUTPUT}]"
echo "${OUTPUT}" | jq --raw-output '.[] | [.handle, .email, .did] | @tsv' | column --table
