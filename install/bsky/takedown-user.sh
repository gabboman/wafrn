# Use this to delete a user by DID in the system

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "${SCRIPT_DIR}/../../.env"

DID=$1
TAKEDOWN_REF="$(date +%s)"

echo Account takedown initiated for account with DID $DID

PAYLOAD="$(cat <<EOF
    {
      "subject": {
        "\$type": "com.atproto.admin.defs#repoRef",
        "did": "${DID}"
      },
      "takedown": {
        "applied": true,
        "ref": "${TAKEDOWN_REF}"
      }
    }
EOF
)"


curl \
  --silent \
  --show-error \
  --request POST \
  --user "admin:${PDS_ADMIN_PASSWORD}" \
  --header "Content-Type: application/json" \
  --data "${PAYLOAD}" \
  "https://${PDS_DOMAIN_NAME}/xrpc/com.atproto.admin.updateSubjectStatus"

echo
