#!/bin/bash

# AIS TUKE Backend Startup Script

echo "🚀 Starting AIS TUKE Backend..."
echo ""

# Check if we're in the backend directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Initialize database if it doesn't exist
if [ ! -f "ais_tuke.db" ]; then
    echo "🗄️  Initializing database..."
    python database.py
fi

# Start the server
echo ""
echo "✅ Starting server on http://127.0.0.1:8000"
echo "📚 API Documentation: http://127.0.0.1:8000/docs"
echo ""
python main.py
