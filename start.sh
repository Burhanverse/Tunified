#!/bin/bash

update_repo() {
    git pull --force
    git submodule update --init --recursive
}

if [[ "$1" == "-c" ]]; then
    update_repo
    npm run bot
elif [[ "$1" == "-d" ]]; then
    update_repo
    npm run bot
else
    npm run bot
fi
