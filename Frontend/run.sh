#!/bin/bash

# Exit on error
set -e

echo "Building React project..."
npm run build

echo "Checking if PM2 is installed..."
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

echo "Stopping existing PM2 process if running..."
pm2 stop valio-nexus || true
pm2 delete valio-nexus || true

echo "Starting server with PM2..."
pm2 start server.js --name valio-nexus

echo "Saving PM2 process list..."
pm2 save

echo "Server started successfully!"
echo "The application is now running on http://0.0.0.0:3000"
echo "Use 'pm2 logs valio-nexus' to view logs"
echo "Use 'pm2 stop valio-nexus' to stop the server"
echo "Use 'pm2 restart valio-nexus' to restart the server"

