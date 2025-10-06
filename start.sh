#!/bin/bash

# MS-Bot Universal Startup Script
# Works on: Termux, Personal Panels, KataBump, Replit, VPS

echo "🚀 Starting MS-Bot V1.0..."
echo "📱 Platform Detection..."

# Platform detection
if [ -n "$REPLIT_DB_URL" ]; then
    export PLATFORM="Replit"
    export PORT=5000
    echo "✅ Detected: Replit"
elif [ -n "$TERMUX_VERSION" ]; then
    export PLATFORM="Termux"
    export PORT=8080
    echo "✅ Detected: Termux"
elif [ -n "$PANEL_URL" ]; then
    export PLATFORM="Panel"
    export PORT=8080
    echo "✅ Detected: Hosting Panel"
else
    export PLATFORM="VPS/Local"
    export PORT=8080
    echo "✅ Detected: VPS/Local"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the bot
echo "🤖 Starting MS-Bot on port $PORT..."
node index.js
