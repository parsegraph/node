#!/bin/bash
while true; do
    aplay ./audio/parsegraph-node-build-started.wav &
    (npm run build && aplay ./audio/parsegraph-node-build-successful.wav) || aplay ./audio/parsegraph-node-build-failed.wav
    make build SITE_URL=$SITE_URL SITE_PORT=$SITE_PORT &
    serverpid=$!
    inotifywait -e modify -r package*.json tsconfig.json .babelrc webpack* src
    kill -TERM $serverpid
done
