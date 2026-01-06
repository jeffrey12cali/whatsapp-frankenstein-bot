#!/bin/bash

TARGET_DIR="./.wwebjs_auth/session/"

until npm start; do
    echo Something went wrong. Retrying in 5 seconds...
    # Relative path where deletion should happen
    PATTERN="Singleton*"

    # Check directory exists
    if [ ! -d "$TARGET_DIR" ]; then
        echo "Error: Directory does not exist: $TARGET_DIR"
    fi

    # Move into the directory
    cd "$TARGET_DIR" || {
        echo "Error: Cannot enter directory $TARGET_DIR"
    }

    # Check if pattern matches any files
    if ! compgen -G "$PATTERN" > /dev/null; then
        echo "Error: No files found matching '$PATTERN' in $TARGET_DIR"
    fi

    # Delete matching files
    if rm $PATTERN; then
        echo "Files deleted successfully."
    else
        echo "Error: Failed to delete files matching '$PATTERN'"
    fi
    sleep 5
done
