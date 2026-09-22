#!/bin/bash

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$APP_DIR/.wwebjs_auth/session"

cd "$APP_DIR" || exit 1

until npm start; do
    echo "Something went wrong. Retrying in 5 seconds..."
    # LocalAuth may have deleted the session dir we were standing in
    cd "$APP_DIR" || exit 1
    rm -f "$TARGET_DIR"/Singleton*
    sleep 5
done
