@echo off
REM Start http-server with SPA routing for local PWA testing

REM Navigate to dist folder
cd dist\ithelp-desk-fe\browser\

REM Start http-server with fallback to index.html for SPA routing
REM This makes all routes serve index.html so Angular routing can work
call npx http-server . -p 8080 -c-1 --spa index.html

REM If that doesn't work, try:
REM call npx http-server . -p 8080 -c-1 -f index.html
