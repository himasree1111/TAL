#!/bin/bash

# TAL Portal — start backend + frontend in one shot
# Usage: ./run.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

cleanup() {
  echo ""
  echo -e "${CYAN}Shutting down...${NC}"
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}Done.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Install deps if needed
if [ ! -d "$ROOT/node_modules" ]; then
  echo -e "${CYAN}Installing frontend dependencies...${NC}"
  (cd "$ROOT" && npm install)
fi

if [ ! -d "$ROOT/backend/node_modules" ]; then
  echo -e "${CYAN}Installing backend dependencies...${NC}"
  (cd "$ROOT/backend" && npm install)
fi

# Start backend (port 4000)
echo -e "${GREEN}Starting backend on http://localhost:4000${NC}"
(cd "$ROOT/backend" && node server.js) &
BACKEND_PID=$!

# Give backend a moment to boot
sleep 2

# Start frontend (port 3000, proxies API to 4000)
echo -e "${GREEN}Starting frontend on http://localhost:3000${NC}"
(cd "$ROOT" && npm start) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backend:  http://localhost:4000${NC}"
echo -e "${GREEN}  Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}  Press Ctrl+C to stop both${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

wait
