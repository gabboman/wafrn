#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "${SCRIPT_DIR}/../.env"

BACKUP_ROOT_DIR=${BACKUP_ROOT_DIR:-$HOME/backup}
BACKUP_KEEP_DAYS=${BACKUP_KEEP_DAYS:-10}
BACKUP_POST_BACKUP_TOOL=${BACKUP_POST_BACKUP_TOOL:-$HOME/post_backup.sh}

case $1 in
  update)
    pushd "${SCRIPT_DIR}/.."
      git pull origin main
      docker compose up --build -d
      docker compose logs -t -n 50 -f
    popd
    ;;
  backup)
    echo "Cleaning up backup directory"
    mkdir -p "$BACKUP_ROOT_DIR"
    find "$BACKUP_ROOT_DIR" -mtime +$BACKUP_KEEP_DAYS -type f -delete
    BACKUP_DIR=$BACKUP_ROOT_DIR/$(date +"%Y%m%dT%H%M%S")
    mkdir -p "$BACKUP_DIR"
    pushd "$BACKUP_DIR"
      echo "Backing up database"
      docker start wafrn-db-1
      docker exec wafrn-db-1 pg_dumpall -c | zstd -9 > db.sql.zst
      echo "Backing up uploads folder"
      tar --zstd -cf uploads.tar.zst -C "$SCRIPT_DIR/../packages/backend/uploads" .
      if [ $ENABLE_BSKY == "true" ]; then
        echo "Backing up bluesky data"
        docker run --rm -v "wafrn_pds:/pds" -v "$(pwd):/backup" -w /pds node:20-alpine tar c -f - . | zstd > pds.tar.zst
      fi
      echo "Done"
    popd
    if [ -f "$BACKUP_POST_BACKUP_TOOL" ]; then
      $BACKUP_POST_BACKUP_TOOL "$BACKUP_DIR"
    fi
    ;;
  restore)
    RESTORE_DIR=$2
    if [ -d "${RESTORE_DIR}" ] ; then
      pushd "$SCRIPT_DIR/.."
        echo "Stopping instance"
        docker compose stop
      popd
      pushd "$RESTORE_DIR"
        echo "Restoring database"
        docker start wafrn-db-1
        zstdcat db.sql.zst | docker exec -i wafrn-db-1 psql -X -f - -d postgres
        echo "Restoring uploads directory"
        rm -rf "$SCRIPT_DIR/../packages/backend/uploads/*"
        tar --zstd -xf uploads.tar.zst -C "$SCRIPT_DIR/../packages/backend/uploads"
        if [ $ENABLE_BSKY == "true" ]; then
          echo "Restoring pds data"
          zstdcat pds.tar.zst | docker run --rm -i -v "wafrn_pds:/pds" -w /pds node:20-alpine sh -c 'rm -rf * && tar x -f -'
        fi
      popd
      pushd "$SCRIPT_DIR/.."
        echo "Restarting intance"
        docker compose up --build -d
      popd
    else
      echo "Please provide a backup directory to restore"
    fi
    ;;
  clean)
    pushd "$SCRIPT_DIR/.."
    rm -f packages/backend/cache/*
    popd
    ;;
  *)
    echo "Valid options:"
    echo "  update: Download latest wafrn from repository, update and restart"
    echo "  backup: Create backup of the current wafrn files"
    echo "  restore: Restore a specific backup"
    echo "  clean: Cleans the cache"
    exit 1
    ;;
esac
