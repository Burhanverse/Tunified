#!/bin/bash

update_repo() {
    git pull
    git submodule update --init --recursive
}

if [[ "$1" == "-c" ]]; then
    update_repo
    npm start
elif [[ "$1" == "-d" ]]; then
    update_repo
    npm run tunified
else
    npm run tunified
fi