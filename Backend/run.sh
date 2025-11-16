#!/bin/bash

# Run FastAPI application with PM2
# This script starts the FastAPI server using uvicorn as a PM2 process

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Error: PM2 is not installed. Please install it first:"
    echo "  npm install -g pm2"
    exit 1
fi

# Check if Python is available
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# Check if uvicorn is available
if ! $PYTHON_CMD -m uvicorn --help &> /dev/null; then
    echo "Error: uvicorn is not installed. Please install it:"
    echo "  pip install uvicorn"
    exit 1
fi

# Stop existing FastAPI process if running
pm2 stop fastapi-app 2>/dev/null || true
pm2 delete fastapi-app 2>/dev/null || true

# Start FastAPI with PM2
echo "Starting FastAPI application with PM2..."
pm2 start "$PYTHON_CMD" --name "fastapi-app" -- \
    -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000

# Save PM2 process list
pm2 save

# Show status
echo ""
echo "FastAPI application started with PM2!"
echo "To view logs: pm2 logs fastapi-app"
echo "To stop: pm2 stop fastapi-app"
echo "To restart: pm2 restart fastapi-app"
echo "To view status: pm2 status"

