#!/bin/bash
while true; do
    npm run autotest
    sleep 0.2
    inotifywait -e modify -r package*.json tsconfig.json .babelrc webpack* src test
done
