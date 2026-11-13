#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo "Node.js is not installed. Install the LTS version from https://nodejs.org and run this file again."; read -n 1; exit 1; fi
(sleep 3; open http://localhost:8765) &
echo "GNC Terminal is running. Keep this window open; close it to stop the updates."
node server.mjs
