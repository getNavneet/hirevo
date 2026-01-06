#!/bin/bash
docker compose down
docker compose up -d --build

cd client && code .
cd ../server && code .
cd ../stt-service && code .