#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Stopping containers..."
docker compose down

echo "Building and starting containers..."
docker compose up -d

echo "Opening projects in VS Code..."
cd "$ROOT_DIR/client" && code -n .
cd "$ROOT_DIR/server" && code -n .
cd "$ROOT_DIR/stt-server" && code -n .

echo "All services are up 🚀"
