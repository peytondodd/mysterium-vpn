#!/bin/bash

ERROR_COLOR="\e[0;31m%s\e[0m\n"

if [ ! -f .env ]; then
    printf $ERROR_COLOR "Environment file must be set!"
    exit 1
fi
source .env

if [ -z $MYSTERIUM_NODE_BIN ]; then
    printf $ERROR_COLOR "MYSTERIUM_NODE_BIN value in .env must be set!"
    exit 1
fi

if [ -z $MYSTERIUM_NODE_CONFIG ]; then
    printf $ERROR_COLOR "MYSTERIUM_NODE_CONFIG value in .env must be set!"
    exit 1
fi

mkdir -p ./bin \
    && cp ${MYSTERIUM_NODE_BIN} ./bin/ \
    && cp -r ${MYSTERIUM_NODE_CONFIG} ./bin/
