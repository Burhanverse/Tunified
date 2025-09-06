#!/bin/bash

# YouTube Music API Server Startup Script
# This script activates the virtual environment and starts the Flask server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_PATH="$PROJECT_ROOT/venv"
SERVER_SCRIPT="$SCRIPT_DIR/server.py"

echo "🎵 Starting YouTube Music API Server..."

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

# Check if required packages are installed
echo "🔍 Checking dependencies..."
python3 -c "import flask, waitress, flask_cors, ytmusicapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📥 Installing missing dependencies..."
    pip install -r "$SCRIPT_DIR/requirements.txt"
fi

# Start the server
echo "🚀 Starting server on http://127.0.0.1:8080"
echo "🔗 Health check: http://127.0.0.1:8080/health"
echo "🔍 Search endpoint: http://127.0.0.1:8080/search?q=<query>"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$SCRIPT_DIR"
python3 server.py
