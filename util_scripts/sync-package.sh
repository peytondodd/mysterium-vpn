#!/bin/bash

# USAGE
# ./util_scripts/sync-package.sh mysterium-vpn-js "yarn build"

CWD="$(pwd -P)"
PACKAGE=$1
COMMAND=$2
FROM_PATH="`cd "$CWD/../$PACKAGE";pwd`"

while :
do
  `cd $FROM_PATH; $COMMAND`

  rsync -arv $FROM_PATH $CWD/node_modules/ \
  --exclude=.idea/ \
  --exclude=.git/ \
  --exclude=node_modules/ \
  --delete

	sleep 5
done
