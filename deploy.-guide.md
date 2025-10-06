# MS-Bot Deployment Guide

## 🚀 Quick Start

### Replit (Recommended)
1. Fork this repl
2. Click "Run" button
3. Enter phone number for pairing
4. Done! ✅

### Termux (Android)
```bash
# Install Node.js
pkg update && pkg install nodejs git

# Clone bot
git clone <your-repo-url>
cd ms-bot

# Install & Run
bash install.sh
bash start.sh
```

### Personal Hosting Panels
1. Upload files to your panel
2. Set Node.js environment
3. Run: `npm install`
4. Start: `node index.js`

### KataBump/Similar Services
1. Create new app
2. Upload project files
3. Set start command: `node index.js`
4. Deploy ✅

### VPS/Server
```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone & Setup
git clone <your-repo-url>
cd ms-bot
bash install.sh

# Run with PM2 (recommended)
npm install -g pm2
pm2 start index.js --name "ms-bot"
pm2 save
pm2 startup
```

## 🔧 Environment Variables

- `PORT`: Server port (default: 8080)
- `HOST`: Server host (default: 0.0.0.0)
- `OWNER_NUMBER`: Your WhatsApp number

## 📱 Platform-Specific Notes

### Replit
- Uses port 5000 automatically
- No additional setup needed
- Best for beginners

### Termux
- Use port 8080 or higher
- Run in background: `nohup node index.js &`
- Keep phone charging

### Hosting Panels
- Check Node.js support
- Usually use port 8080
- Enable persistent processes

## 🆘 Troubleshooting

- **Port Error**: Change PORT in environment
- **Permission Error**: Run `chmod +x start.sh`
- **Module Error**: Run `npm install` again
-
