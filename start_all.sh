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
    echo "🛑 Shutting down services..."
    if [ ! -z "$API_SERVER_PID" ]; then
        kill $API_SERVER_PID 2>/dev/null
        echo "📡 YouTube Music API server stopped"
    fi
    if [ ! -z "$BOT_PID" ]; then
        kill $BOT_PID 2>/dev/null
        echo "🤖 Bot stopped"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "🎵 Starting Tunified Bot Services..."

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo "❌ Virtual environment not found at $VENV_PATH"
    echo "Please create a virtual environment first:"
    echo "python3 -m venv $VENV_PATH"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source "$VENV_PATH/bin/activate"

# Check dependencies
echo "🔍 Checking Python dependencies..."
python3 -c "import flask, waitress, flask_cors, ytmusicapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📥 Installing missing Python dependencies..."
    pip install -r "$PROJECT_ROOT/src/ytmusic/requirements.txt"
fi

echo "🔍 Checking Node.js dependencies..."
cd "$PROJECT_ROOT"
if [ ! -d "node_modules" ]; then
    echo "📥 Installing Node.js dependencies..."
    npm install
fi

# Start YouTube Music API server
echo "🚀 Starting YouTube Music API server..."
cd "$PROJECT_ROOT/src/ytmusic"
python3 server.py &
API_SERVER_PID=$!

# Wait for API server to start
echo "⏳ Waiting for API server to start..."
sleep 3

# Test API server
if curl -s http://127.0.0.1:8080/health > /dev/null; then
    echo "✅ YouTube Music API server is running"
else
    echo "❌ Failed to start YouTube Music API server"
    cleanup
fi

# Start the bot
echo "🤖 Starting Telegram bot..."
cd "$PROJECT_ROOT"
node bot.mjs &
BOT_PID=$!

echo ""
echo "🎉 All services started successfully!"
echo "📡 YouTube Music API: http://127.0.0.1:8080"
echo "🤖 Telegram Bot: Running"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
