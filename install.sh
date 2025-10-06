#!/bin/bash

# MS-Bot Installation Script
# Universal installer for all platforms

echo "🚀 MS-Bot V1.0 Installer"
echo "========================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "📥 Please install Node.js first:"
    echo "   Termux: pkg install nodejs"
    echo "   Ubuntu: apt install nodejs npm"
    echo "   CentOS: yum install nodejs npm"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create media folder
mkdir -p media

# Set permissions
chmod +x start.sh

echo "✅ Installation completed!"
echo "🚀 To start: bash start.sh"
echo "📱 Or use: npm start"
