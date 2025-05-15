#!/bin/bash

# run this file from WAFRN root directory, e.g.
#
# $ ./install/env_local_setup.sh

export ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

VAPID_KEYS="$(npx --yes web-push generate-vapid-keys --json)"

export WEBPUSH_PRIVATE="$(echo "$VAPID_KEYS" | jq -r .privateKey)"
export WEBPUSH_PUBLIC="$(echo "$VAPID_KEYS" | jq -r .publicKey)"
export WEBPUSH_EMAIL="mailto:wafrn@example.com"

# this might be set earlier

pushd $ROOT_DIR

touch .env
cp packages/frontend/Caddyfile.local.example packages/frontend/Caddyfile
cp packages/backend/environment.local.example.ts packages/backend/environment.ts
cp docker-compose.local.yml docker-compose.yml

perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' packages/frontend/Caddyfile
perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' packages/frontend/Caddyfile

perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' packages/backend/environment.ts
perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' packages/backend/environment.ts

popd
