#!/bin/bash

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
cd "$PROJECT_ROOT"  # Ensure we're in project root

# Configuration
HOSTS="prod:dsf-drupal-0.internal.lib.virginia.edu dev:dsf-drupal-dev-0.internal.lib.virginia.edu"
DEFAULT_ENV="dev"
BACKUP_DIR="$PROJECT_ROOT/backups"
DUMP_DIR="$PROJECT_ROOT/database/dumps"
IMPORT_DB=true
USE_LATEST=false

set -e  # Exit on error

for arg in "$@"
do
    case $arg in
        --latest)
        USE_LATEST=true
        shift
        ;;
    esac
done

mkdir -p "$DUMP_DIR"

while getopts "hnl" opt; do
    case $opt in
        h) show_help=true ;;
        n) IMPORT_DB=false ;;
        l) USE_LATEST=true ;;
        *) show_help=true ;;
    esac
done
shift $((OPTIND-1))

if [[ ! -d "$BACKUP_DIR" ]]; then
    echo "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

show_help() {
    echo "Usage: $0 [-n] [-l] [env]"
    echo "Options:"
    echo "  -n    Download only, skip import and cache clear"
    echo "  -l    Use latest backup instead of downloading new one"
    echo "  -h    Show this help message"
    echo "  --latest    Use the most recent local dump instead of fetching from remote"
    echo "Environments:"
    for pair in $HOSTS; do
        env=${pair%%:*}
        host=${pair#*:}
        [[ "$env" == "$DEFAULT_ENV" ]] && default=" (default)" || default=""
        echo "  $env: $host$default"
    done
    exit 1
}

[[ -n "$show_help" ]] && show_help
ENV="${1:-$DEFAULT_ENV}"

HOST=""
for pair in $HOSTS; do
    if [[ "${pair%%:*}" == "$ENV" ]]; then
        HOST="${pair#*:}"
        break
    fi
done

[[ -z "$HOST" ]] && echo "Error: Unknown environment '$ENV'" && show_help

if $USE_LATEST; then
    # Find the most recent dump file
    LATEST_DUMP=$(ls -t "$DUMP_DIR"/*.sql.gz 2>/dev/null | head -n1)
    if [ -z "$LATEST_DUMP" ]; then
        echo "Error: No existing dump files found in $DUMP_DIR"
        exit 1
    fi
    echo "Using latest local dump: $LATEST_DUMP"
else
    eval "$(ssh-agent -s)"
    ssh-add

    echo "Using host: $HOST"

    echo "Checking connection to $HOST..."
    if [[ $(ssh -o ConnectTimeout=5 "$HOST" sudo true) ]]; then
        echo "Connection to $HOST failed.  Check that you are on VPN"
        exit 1
    fi     

    TSTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP="${BACKUP_DIR}/dh-backup-$ENV-$TSTAMP.sql.gz"
    TEMP_SQL=$(mktemp)

    echo "Retrieving db from $HOST..."
    ssh -t "$HOST" sudo docker exec -it drupal-0 drush sql-dump --extra-dump=--no-tablespaces | tee "$TEMP_SQL" | gzip > "$BACKUP"

    echo "Validating SQL dump..."
    if ! ddev mysql < "$TEMP_SQL" --silent --execute="quit" 2>/dev/null; then
        echo "Error: Invalid SQL syntax detected in dump"
        rm "$BACKUP" "$TEMP_SQL"
        exit 1
    fi

    if [[ $(file $BACKUP) == *truncated* ]]; then
        echo "Error: truncated SQL detected in dump.  Check to see if connection timed out.  NB: this script assumes VPN access to the host."
        rm "$BACKUP" "$TEMP_SQL"
        exit 1
    fi

    rm "$TEMP_SQL"

    if [[ ! -f "$BACKUP" ]] || [[ ! -s "$BACKUP" ]]; then
        echo "Error: Backup file is empty or not created"
        rm -f "$BACKUP"
        exit 1
    fi

    if ! gzip -t "$BACKUP" 2>/dev/null; then
        echo "Error: Backup file is not a valid gzip file"
        rm "$BACKUP"
        exit 1
    fi

    echo "Backup created successfully: $BACKUP ($(du -h "$BACKUP" | cut -f1))"
fi

if $IMPORT_DB; then
    echo "Restoring db..."
    if $USE_LATEST; then
        ddev import-db --src="$LATEST_DUMP"
    else
        gunzip -c "$BACKUP" | ddev import-db
    fi
    echo "Clearing cache..."
    ddev drush cr
fi

echo "✓ Database update completed"
