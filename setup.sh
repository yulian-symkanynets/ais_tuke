#!/bin/bash

# Setup script for AIS-TUKE AI Agents

echo "🚀 Setting up AIS-TUKE AI Agents..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
cd ai_agents
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit ai_agents/.env with your configuration"
else
    echo "✓ .env file already exists"
fi

cd ..

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p workspace
mkdir -p workspace/backend
mkdir -p workspace/frontend
mkdir -p workspace/tests
mkdir -p memory

# Check if Ollama is installed
if command -v ollama &> /dev/null; then
    echo "✓ Ollama is installed"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✓ Ollama is running"
    else
        echo "⚠️  Ollama is not running. Start it with: ollama serve"
    fi
    
    # Check if mistral model is available
    if ollama list | grep -q mistral; then
        echo "✓ Mistral model is available"
    else
        echo "📥 Pulling Mistral model..."
        ollama pull mistral
    fi
else
    echo "❌ Ollama is not installed"
    echo "   Install from: https://ollama.com/download"
    echo "   Then run: ollama pull mistral"
fi

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
    echo ".venv/" >> .gitignore
    echo "__pycache__/" >> .gitignore
    echo "*.pyc" >> .gitignore
    echo ".env" >> .gitignore
    echo "memory/*.json" >> .gitignore
    git add .
    git commit -m "Initial commit with AI agents setup"
else
    echo "✓ Git repository already initialized"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start Ollama: ollama serve"
echo "2. Edit ai_agents/.env if needed"
echo "3. Run agents: python ai_agents/main.py"
echo ""
echo "For overnight runs, use: nohup python ai_agents/main.py > agent.log 2>&1 &"