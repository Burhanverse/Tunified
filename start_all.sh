#!/bin/bash

# Tunified Bot Startup Script
# This script manages both the YouTube Music API server and the Telegram bot

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$PROJECT_ROOT/venv"
API_SERVER_SCRIPT="$PROJECT_ROOT/src/ytmusic/server.py"
BOT_SCRIPT="$PROJECT_ROOT/bot.mjs"

API_SERVER_PID=""
BOT_PID=""

cleanup() {
    echo "🛑 Shutting down..."
    if [ ! -z "$API_SERVER_PID" ]; then
        kill $API_SERVER_PID 2>/dev/null
    fi
    if [ ! -z "$BOT_PID" ]; then
        kill $BOT_PID 2>/dev/null
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "🎵 Starting Tunified Bot Services..."

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv "$VENV_PATH" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Check dependencies
python3 -c "import flask, waitress, flask_cors, ytmusicapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📥 Installing Python dependencies..."
    pip install -r "$PROJECT_ROOT/src/ytmusic/requirements.txt" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Python dependencies"
        exit 1
    fi
fi

cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    echo "📥 Installing Node.js dependencies..."
    npm install >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Node.js dependencies"
        exit 1
    fi
fi

# Start YouTube Music API server
echo "🚀 Starting services..."
cd "$PROJECT_ROOT/src/ytmusic"
python3 server.py >/dev/null 2>&1 &
API_SERVER_PID=$!

# Test API server
for i in {1..5}; do
    if curl -s http://127.0.0.1:8080/health > /dev/null 2>&1; then
        break
    fi
    if [ $i -eq 5 ]; then
        echo "❌ Failed to start YouTube Music API server"
        cleanup
        exit 1
    fi
    sleep 1
done

# Start the bot
cd "$PROJECT_ROOT"
node bot.mjs >/dev/null 2>&1 &
BOT_PID=$!

echo "✅ Services started successfully!"
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
