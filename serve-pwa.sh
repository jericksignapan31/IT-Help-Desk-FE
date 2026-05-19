#!/bin/bash
# Start http-server with SPA routing for local PWA testing

# Navigate to dist folder
cd dist/ithelp-desk-fe/browser/

# Start http-server with fallback to index.html for SPA routing
# This makes all routes serve index.html so Angular routing can work
npx http-server . -p 8080 -c-1 --spa index.html

# Alternative if http-server doesn't support --spa:
# npx http-server . -p 8080 -c-1 -f index.html
