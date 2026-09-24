@echo off
cd /d "%~dp0"
echo Star Trek Attack Wing Remodulated
echo Open http://127.0.0.1:4173 in your browser.
echo Keep this window open while using the builder.
node scripts\serve.cjs
pause
