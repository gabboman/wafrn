#!/bin/sh
set -e

rm -rf /var/www/html/frontend/*
rm -rf /var/www/html/frontend/.* 2>/dev/null || true

cp -a /app/frontend /var/www/html/

exec "$@"
