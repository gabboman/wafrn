#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

case $1 in
  update)
    git pull origin main
    docker compose up --build -d
    docker compose logs -t -n 50 -f
    ;;
  backup)
    echo "Cleaning up backup directory"
    find ~/backup -mtime +10 -type f -delete
    BACKUP_DIR=~/backup/$(date +"%Y%m%dT%H%M%S")
    mkdir -p $BACKUP_DIR
    pushd $BACKUP_DIR
      echo "Backing up database"
      docker start wafrn-db-1
      docker exec wafrn-db-1 pg_dumpall -c | zstd -9 > db.sql.zst
      echo "Backing up uploads folder"
      tar --zstd -cf uploads.tar.zst -C $SCRIPT_DIR/../packages/backend/uploads .
      echo "Backing up bluesky data"
      docker run --rm -v "wafrn_pds:/pds" -v "$(pwd):/backup" -w /pds node:20-alpine tar c -f - . | zstd > pds.tar.zst
      echo "Done"
    popd
    ;;
  restore)
    RESTORE_DIR=$2
    if [ -d "${RESTORE_DIR}" ] ; then
      pushd $SCRIPT_DIR/..
        echo "Stopping instance"
        docker compose stop
      popd
      pushd $RESTORE_DIR
        echo "Restoring database"
        docker start wafrn-db-1
        zstdcat db.sql.zst | docker exec -i wafrn-db-1 psql -X -f - -d postgres
        echo "Restoring uploads directory"
        rm -rf $SCRIPT_DIR/../packages/backend/uploads/*
        tar --zstd -xf uploads.tar.zst -C $SCRIPT_DIR/../packages/backend/uploads
        echo "Restoring pds data"
        zstdcat pds.tar.zst | docker run --rm -i -v "wafrn_pds:/pds" -w /pds node:20-alpine sh -c 'rm -rf * && tar x -f -'
      popd
      pushd $SCRIPT_DIR/..
        echo "Restarting intance"
        docker compose up --build -d
      popd
    else
      echo "Please provide a backup directory to restore"
    fi
    ;;
  *)
    echo "Valid options:"
    echo "  update: Download latest wafrn from repository, update and restart"
    echo "  backup: Create backup of the current wafrn files"
    echo "  restore: Restore a specific backup"
    exit 1
    ;;
esac
