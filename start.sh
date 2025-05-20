#!/bin/bash

update_repo() {
    git pull --force
}

if [[ "$1" == "-c" ]]; then
    update_repo
    npm run tunified
elif [[ "$1" == "-d" ]]; then
    update_repo
    npm run app
else
    npm run tunified
fi
