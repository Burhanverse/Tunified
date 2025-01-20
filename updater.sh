#!/bin/bash

REPO_URL="https://github.com/Burhanverse/Tunified.git"

# Function
update_repo() {
    echo "Repository already exists. Updating..."
    git pull --recurse-submodules --ff-only || {
        echo "Pull failed. Forcing reset..."
        git fetch --all
        git reset --hard origin/main
        git submodule update --init --recursive
    }
    echo "Repository updated successfully!"
}

# Check
if [ -d ".git" ]; then
    # Verify
    CURRENT_URL=$(git config --get remote.origin.url)
    if [ "$CURRENT_URL" == "$REPO_URL" ]; then
        update_repo
    else
        echo "Error: The current directory is a Git repository, but not for $REPO_URL."
        exit 1
    fi
else
    # Clone
    echo "Cloning repository..."
    git clone --recurse-submodules $REPO_URL .
    if [ $? -ne 0 ]; then
        echo "Error: Failed to clone the repository."
        exit 1
    fi
    echo "Repository cloned successfully!"
fi
