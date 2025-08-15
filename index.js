const mineflayer = require('mineflayer');
const express = require('express');
const path = require('path');
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');

const app = express();
const PORT = process.env.PORT || 3000;

// Store active bots
const activeBots = new Map();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minecraft Bot Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .add-bot-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            border: 2px dashed #dee2e6;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            font-weight: 600;
            color: #495057;
            margin-bottom: 8px;
        }
        
        input[type="text"], input[type="number"] {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        input[type="text"]:focus, input[type="number"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 15px;
        }
        
        button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .add-btn {
            width: 100%;
            margin-top: 15px;
            padding: 15px;
            font-size: 18px;
        }
        
        .bot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .bot-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            border: 1px solid #e9ecef;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .bot-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .bot-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .bot-name {
            font-size: 18px;
            font-weight: 700;
            color: #333;
        }
        
        .bot-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-online {
            background: #d4edda;
            color: #155724;
        }
        
        .status-offline {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status-connecting {
            background: #fff3cd;
            color: #856404;
        }
        
        .bot-info {
            margin-bottom: 15px;
        }
        
        .bot-info p {
            margin: 5px 0;
            color: #6c757d;
        }
        
        .bot-controls {
            display: flex;
            gap: 10px;
        }
        
        .btn-start {
            background: linear-gradient(135deg, #28a745, #20c997);
        }
        
        .btn-stop {
            background: linear-gradient(135deg, #dc3545, #fd7e14);
        }
        
        .btn-remove {
            background: linear-gradient(135deg, #6c757d, #495057);
        }
        
        .btn-small {
            padding: 8px 15px;
            font-size: 14px;
        }
        
        .logs-section {
            margin-top: 30px;
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
        }
        
        .logs-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .logs-container {
            background: #1a1a1a;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            padding: 15px;
            border-radius: 8px;
            height: 300px;
            overflow-y: auto;
            font-size: 13px;
            line-height: 1.4;
        }
        
        .log-entry {
            margin-bottom: 5px;
        }
        
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            border-left: 4px solid #667eea;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        
        .toast.show {
            transform: translateX(0);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        .empty-state h3 {
            margin-bottom: 10px;
            color: #495057;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Minecraft Bot Manager</h1>
        
        <div class="add-bot-section">
            <h3 style="margin-bottom: 20px; color: #495057;">Add New Bot</h3>
            <form id="addBotForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="server">Server Address</label>
                        <input type="text" id="server" placeholder="e.g., ved2612.aternos.me" required>
                    </div>
                    <div class="form-group">
                        <label for="port">Port</label>
                        <input type="number" id="port" placeholder="25565" min="1" max="65535" required>
                    </div>
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" placeholder="Bot_123" required>
                    </div>
                </div>
                <button type="submit" class="add-btn">➕ Add Bot</button>
            </form>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #dee2e6;">
                <a href="/keep-alive" class="add-btn" style="text-decoration: none; background: linear-gradient(135deg, #28a745, #20c997); display: block; text-align: center;">
                    🔄 Keep Server Alive
                </a>
                <p style="margin-top: 10px; color: #6c757d; font-size: 14px; text-align: center;">
                    Click to open keep-alive page (prevents hosting shutdown)
                </p>
            </div>
        </div>
        
        <div id="botsContainer">
            <div class="empty-state">
                <h3>No bots configured</h3>
                <p>Add your first bot using the form above!</p>
            </div>
        </div>
        
        <div class="logs-section">
            <div class="logs-header">
                <h3 style="color: #495057;">Bot Logs</h3>
                <button onclick="clearLogs()" class="btn-small">Clear Logs</button>
            </div>
            <div class="logs-container" id="logsContainer">
                <div class="log-entry">[SYSTEM] Bot manager started. Ready to accept connections.</div>
            </div>
        </div>
    </div>

    <script>
        let bots = JSON.parse(localStorage.getItem('minecraftBots') || '[]');
        let logEntries = [];
        
        // Initialize page
        document.addEventListener('DOMContentLoaded', () => {
            renderBots();
            syncBotStates(); // Add this line instead of restoreActiveBots()
        });
        
        // Add bot form handler
        document.getElementById('addBotForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const server = document.getElementById('server').value.trim();
            const port = parseInt(document.getElementById('port').value);
            const username = document.getElementById('username').value.trim();
            
            if (!server || !port || !username) {
                showToast('Please fill in all fields!', 'error');
                return;
            }
            
            const botId = Date.now().toString();
            const newBot = {
                id: botId,
                server,
                port,
                username,
                status: 'offline',
                health: 0,
                food: 0,
                createdAt: new Date().toLocaleString()
            };
            
            bots.push(newBot);
            saveBots();
            renderBots();
            
            // Clear form
            document.getElementById('addBotForm').reset();
            showToast(\`Bot "\${username}" added successfully!\`, 'success');
        });
        
        function saveBots() {
            localStorage.setItem('minecraftBots', JSON.stringify(bots));
        }
        
        function renderBots() {
            const container = document.getElementById('botsContainer');
            
            if (bots.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <h3>No bots configured</h3>
                        <p>Add your first bot using the form above!</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = \`
                <div class="bot-grid">
                    \${bots.map(bot => \`
                        <div class="bot-card" data-bot-id="\${bot.id}">
                            <div class="bot-header">
                                <div class="bot-name">\${bot.username}</div>
                                <div class="bot-status status-\${bot.status}">\${bot.status}</div>
                            </div>
                            <div class="bot-info">
                                <p><strong>Server:</strong> \${bot.server}:\${bot.port}</p>
                                <p><strong>Health:</strong> \${bot.health}/20 | <strong>Food:</strong> \${bot.food}/20</p>
                                <p><strong>Created:</strong> \${bot.createdAt}</p>
                            </div>
                            <div class="bot-controls">
                                <button onclick="startBot('\${bot.id}')" class="btn-start btn-small" \${bot.status === 'online' ? 'disabled' : ''}>
                                    \${bot.status === 'connecting' ? 'Connecting...' : 'Start'}
                                </button>
                                <button onclick="stopBot('\${bot.id}')" class="btn-stop btn-small" \${bot.status === 'offline' ? 'disabled' : ''}>Stop</button>
                                <button onclick="removeBot('\${bot.id}')" class="btn-remove btn-small">Remove</button>
                            </div>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }
        
        async function startBot(botId) {
            const bot = bots.find(b => b.id === botId);
            if (!bot) return;
            
            bot.status = 'connecting';
            renderBots();
            
            try {
                const response = await fetch('/api/bots/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bot)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    bot.status = 'online';
                    addLog(\`[BOT] \${bot.username} started successfully\`);
                    showToast(\`Bot "\${bot.username}" started!\`, 'success');
                } else {
                    bot.status = 'offline';
                    addLog(\`[ERROR] Failed to start \${bot.username}: \${result.error}\`);
                    showToast(\`Failed to start bot: \${result.error}\`, 'error');
                }
            } catch (error) {
                bot.status = 'offline';
                addLog(\`[ERROR] Connection error for \${bot.username}: \${error.message}\`);
                showToast('Connection error!', 'error');
            }
            
            saveBots();
            renderBots();
        }
        
        async function stopBot(botId) {
            const bot = bots.find(b => b.id === botId);
            if (!bot) return;
            
            try {
                const response = await fetch('/api/bots/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: botId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    bot.status = 'offline';
                    bot.health = 0;
                    bot.food = 0;
                    addLog(\`[BOT] \${bot.username} stopped\`);
                    showToast(\`Bot "\${bot.username}" stopped!\`, 'success');
                } else {
                    addLog(\`[ERROR] Failed to stop \${bot.username}: \${result.error}\`);
                    showToast(\`Failed to stop bot: \${result.error}\`, 'error');
                }
            } catch (error) {
                addLog(\`[ERROR] Error stopping \${bot.username}: \${error.message}\`);
                showToast('Error stopping bot!', 'error');
            }
            
            saveBots();
            renderBots();
        }
        
        function removeBot(botId) {
            const bot = bots.find(b => b.id === botId);
            if (!bot) return;
            
            if (confirm(\`Are you sure you want to remove bot "\${bot.username}"?\`)) {
                // Stop bot first if running
                if (bot.status === 'online') {
                    stopBot(botId);
                }
                
                bots = bots.filter(b => b.id !== botId);
                saveBots();
                renderBots();
                addLog(\`[SYSTEM] Removed bot \${bot.username}\`);
                showToast(\`Bot "\${bot.username}" removed!\`, 'success');
            }
        }
        
        async function restoreActiveBots() {
            const activeBots = bots.filter(bot => bot.status === 'online');
            
            for (const bot of activeBots) {
                addLog(\`[SYSTEM] Restoring bot \${bot.username}...\`);
                await startBot(bot.id);
            }
        }
        
        function addLog(message) {
            const timestamp = new Date().toLocaleTimeString();
            logEntries.push(\`[\${timestamp}] \${message}\`);
            
            // Keep only last 100 log entries
            if (logEntries.length > 100) {
                logEntries = logEntries.slice(-100);
            }
            
            const logsContainer = document.getElementById('logsContainer');
            logsContainer.innerHTML = logEntries.map(entry => 
                \`<div class="log-entry">\${entry}</div>\`
            ).join('');
            
            // Auto-scroll to bottom
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
        
        function clearLogs() {
            logEntries = [];
            document.getElementById('logsContainer').innerHTML = 
                '<div class="log-entry">[SYSTEM] Logs cleared.</div>';
        }
        
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = \`
                <div style="font-weight: 600; margin-bottom: 5px;">\${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} \${type.toUpperCase()}</div>
                <div>\${message}</div>
            \`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 3000);
        }
        
        // Periodic status updates
        setInterval(async () => {
            try {
                const response = await fetch('/api/bots/status');
                
                if (!response.ok) {
                    // Server might be down, mark all bots as offline
                    bots.forEach(bot => {
                        bot.status = 'offline';
                        bot.health = 0;
                        bot.food = 0;
                    });
                    saveBots();
                    renderBots();
                    return;
                }
                
                const statusData = await response.json();
                
                // Update bot statuses and stats
                bots.forEach(bot => {
                    const serverBot = statusData.bots.find(sb => sb.id === bot.id);
                    if (serverBot) {
                        bot.status = serverBot.status;
                        bot.health = serverBot.health || 0;
                        bot.food = serverBot.food || 0;
                    } else {
                        // Bot not found on server, mark as offline
                        bot.status = 'offline';
                        bot.health = 0;
                        bot.food = 0;
                    }
                });
                
                saveBots();
                renderBots();
            } catch (error) {
                console.error('Error fetching bot status:', error);
                // On network error, mark all bots as offline
                bots.forEach(bot => {
                    bot.status = 'offline';
                    bot.health = 0;
                    bot.food = 0;
                });
                saveBots();
                renderBots();
            }
        }, 5000); // Update every 5 seconds

        // Call this when the page loads to sync with server state
        async function syncBotStates() {
            try {
                // First cleanup any phantom bots on server
                await fetch('/api/bots/cleanup', { method: 'POST' });
                
                // Reset all local bot states to offline
                bots.forEach(bot => {
                    bot.status = 'offline';
                    bot.health = 0;
                    bot.food = 0;
                });
                
                saveBots();
                renderBots();
                addLog('[SYSTEM] Bot states synchronized with server');
            } catch (error) {
                console.error('Error syncing bot states:', error);
                addLog('[ERROR] Failed to sync bot states with server');
            }
        }
    </script>
    <script type="text/javascript">
        atOptions = {
            'key' : 'c0cc15bcf734bde350aa9086ebcd4a76',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
        };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/c0cc15bcf734bde350aa9086ebcd4a76/invoke.js"></script>
    <script type="text/javascript">
        atOptions = {
            'key' : 'b987fb4d182bea2be473fbc05360edb5',
            'format' : 'iframe',
            'height' : 60,
            'width' : 468,
            'params' : {}
        };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/b987fb4d182bea2be473fbc05360edb5/invoke.js"></script>
    <script type='text/javascript' src='//pl27256382.profitableratecpm.com/22/50/65/225065bacd24ea44ccf18ad26725d3ba.js'></script>
</body>
</html>
  `);
});

app.get('/keep-alive', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keep Alive - Bot Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .keep-alive-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 2.5rem;
        }
        
        .status {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
        }
        
        .refresh-info {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .back-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
        }
        
        .back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .countdown {
            font-size: 18px;
            font-weight: 600;
            color: #495057;
            margin: 15px 0;
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="keep-alive-container">
        <h1>🔄 Keep Alive</h1>
        <div class="status">
            ✅ Keep Alive is Active
        </div>
        <div class="refresh-info">
            This page will automatically refresh every 3-5 minutes to keep the server alive.
            <br>Your bots will continue running uninterrupted.
        </div>
        <div class="countdown pulse" id="countdown">
            Next refresh in: <span id="timer">--</span>
        </div>
        <a href="/" class="back-btn">🏠 Back to Main Page</a>
    </div>

    <script>
        let refreshTime;
        let countdownInterval;
        let startTime;
        
        function setRandomRefreshTime() {
            // Random time between 3-5 minutes (180-300 seconds)
            const minTime = 3 * 60 * 1000; // 3 minutes in ms
            const maxTime = 5 * 60 * 1000; // 5 minutes in ms
            refreshTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
            startTime = Date.now();
            
            console.log(\`Next refresh scheduled in \${(refreshTime / 1000 / 60).toFixed(1)} minutes\`);
            
            // Set timeout for refresh
            setTimeout(() => {
                console.log('Refreshing page to keep server alive...');
                window.location.reload();
            }, refreshTime);
            
            // Update countdown every second
            updateCountdown();
        }
        
        function updateCountdown() {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            
            countdownInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, refreshTime - elapsed);
                
                if (remaining <= 0) {
                    document.getElementById('timer').textContent = 'Refreshing...';
                    clearInterval(countdownInterval);
                    return;
                }
                
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                
                document.getElementById('timer').textContent = 
                    \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
            }, 1000);
        }
        
        // Start the keep-alive cycle when page loads
        document.addEventListener('DOMContentLoaded', () => {
            setRandomRefreshTime();
        });
        
        // Log to console for debugging
        console.log('Keep Alive page loaded - automatic refresh cycle started');
    </script>
</body>
</html>
  `);
});

// API Routes
app.post('/api/bots/start', async (req, res) => {
  try {
    const { id, server, port, username } = req.body;
    
    if (activeBots.has(id)) {
      return res.json({ success: false, error: 'Bot already running' });
    }
    
    const bot = createBot(id, server, port, username);
    activeBots.set(id, bot);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/bots/stop', (req, res) => {
  try {
    const { id } = req.body;
    
    if (!activeBots.has(id)) {
      return res.json({ success: false, error: 'Bot not running' });
    }
    
    const botData = activeBots.get(id);
    
    // Prevent auto-reconnection
    botData.shouldReconnect = false;
    
    // Clean up follow state
    if (botData.followInterval) {
      clearInterval(botData.followInterval);
      botData.followInterval = null;
    }
    botData.isFollowing = false;
    botData.followTarget = null;
    
    // Check if bot instance exists before calling quit
    if (botData.bot && typeof botData.bot.quit === 'function') {
      botData.bot.quit('Stopped by user');
    }
    
    // Clear any reconnect timeout
    if (botData.reconnectTimeout) {
      clearTimeout(botData.reconnectTimeout);
    }
    
    // Clear wander interval if it exists
    if (botData.bot && botData.bot.wanderInterval) {
      clearInterval(botData.bot.wanderInterval);
    }
    
    activeBots.delete(id);
    res.json({ success: true });
  } catch (error) {
    console.log(`[SERVER] Error stopping bot: ${error.message}`);
    res.json({ success: false, error: error.message });
  }
});

// 2. Add a cleanup endpoint to reset all bot states
app.post('/api/bots/cleanup', (req, res) => {
  try {
    // Clear all active bots
    activeBots.forEach((botData, id) => {
      if (botData.bot && typeof botData.bot.quit === 'function') {
        botData.bot.quit('Server cleanup');
      }
      if (botData.reconnectTimeout) {
        clearTimeout(botData.reconnectTimeout);
      }
      if (botData.bot && botData.bot.wanderInterval) {
        clearInterval(botData.bot.wanderInterval);
      }
    });
    
    activeBots.clear();
    res.json({ success: true, message: 'All bots cleaned up' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/bots/status', (req, res) => {
  const botsStatus = [];
  
  activeBots.forEach((botData, id) => {
    botsStatus.push({
      id,
      status: botData.status,
      health: botData.bot?.health || 0,
      food: botData.bot?.food || 0
    });
  });
  
  res.json({ bots: botsStatus });
});

function createBot(id, host, port, username) {
  console.log(`[BOT-${id}] Attempting to connect to ${host}:${port} as ${username}`);
  
  const botData = {
    status: 'connecting',
    bot: null,
    reconnectTimeout: null,
    host: host,
    port: port,
    username: username,
    shouldReconnect: true,
    currentCoordinates: null,
    // ADD THESE NEW PROPERTIES:
    followTarget: null,        // Player to follow
    followInterval: null,      // Interval for following
    isFollowing: false        // Follow state
  };
  
  function connectBot() {
    try {
      const bot = mineflayer.createBot({
        host: botData.host,
        port: botData.port,
        username: botData.username,
        hideErrors: false,
        checkTimeoutInterval: 30 * 1000,
        keepAlive: true,
        connectTimeout: 20 * 1000
      });

      botData.bot = bot;
      bot.loadPlugin(pathfinder);

      bot.once('spawn', () => {
        console.log(`[BOT-${id}] Joined the server successfully.`);
        botData.status = 'online';
        
        // If we were following someone before disconnect, try to resume
        if (botData.isFollowing && botData.followTarget) {
          console.log(`[BOT-${id}] Attempting to resume following ${botData.followTarget}`);
          setTimeout(() => {
            const targetPlayer = bot.players[botData.followTarget];
            if (targetPlayer && targetPlayer.entity) {
              bot.chat(`I'm back! Resuming following ${botData.followTarget}.`);
              startFollowing(bot, id, botData.followTarget);
            } else {
              console.log(`[BOT-${id}] Could not find ${botData.followTarget} after reconnect, stopping follow`);
              stopFollowing(bot, id);
            }
          }, 3000);
        }
        // If we had coordinates before disconnect, go back to them
        else if (botData.currentCoordinates) {
          const { x, y, z } = botData.currentCoordinates;
          console.log(`[BOT-${id}] Returning to previous coordinates: ${x}, ${y}, ${z}`);
          setTimeout(() => {
            goToCoordinates(bot, id, x, y, z);
          }, 2000);
        } else {
          wanderAround(bot);
        }
        
        // Water movement helper (same as before)
        const waterIds = [
          bot.registry.blocksByName.water?.id,
          bot.registry.blocksByName.flowing_water?.id
        ].filter(id => id !== undefined);
        
        setInterval(() => {
          if (!bot.entity) return;
          
          const currentBlock = bot.blockAt(bot.entity.position);
          if (currentBlock && waterIds.includes(currentBlock.type)) {
            const waterSurface = findWaterSurface(bot, bot.entity.position);
            if (waterSurface && bot.entity.position.y < waterSurface - 0.5) {
              bot.setControlState('jump', true);
            } else {
              bot.setControlState('jump', false);
            }
          }
        }, 200);
        
        // Monitor health and food levels
        bot.on('health', () => {
          console.log(`[BOT-${id}] Health: ${bot.health}, Food: ${bot.food}, Saturation: ${bot.foodSaturation}`);
          checkAndEat(bot, id);
        });

        // Enhanced chat handler with coordinate pathfinding
        bot.on('chat', (username, message) => {
          if (username === bot.username) return;
          
          const lowerMessage = message.toLowerCase();
          const botNameLower = bot.username.toLowerCase();
          
          // Follow command
          if (lowerMessage.includes(`${botNameLower} follow`)) {
            const player = bot.players[username];
            if (player && player.entity) {
              // Stop any current activities
              clearInterval(bot.wanderInterval);
              if (botData.followInterval) {
                clearInterval(botData.followInterval);
              }
              
              // Clear stored coordinates since we're now following
              botData.currentCoordinates = null;
              
              botData.followTarget = username;
              botData.isFollowing = true;
              
              console.log(`[BOT-${id}] Now following ${username}`);
              bot.chat(`I'm now following you, ${username}!`);
              
              startFollowing(bot, id, username);
              return;
            } else {
              bot.chat(`Sorry ${username}, I can't see you to follow!`);
              return;
            }
          }
          
          // Stop following command
          if (lowerMessage.includes(`${botNameLower} stop follow`) || lowerMessage.includes(`${botNameLower} unfollow`)) {
            if (botData.isFollowing && botData.followTarget === username) {
              stopFollowing(bot, id);
              bot.chat(`Stopped following you, ${username}!`);
              return;
            } else if (botData.isFollowing && botData.followTarget !== username) {
              bot.chat(`I'm currently following ${botData.followTarget}, not you!`);
              return;
            } else {
              bot.chat(`I'm not following anyone right now!`);
              return;
            }
          }
          
          // Debug command to check inventory
          if (lowerMessage === `${botNameLower} inventory` || lowerMessage === `${botNameLower} inv`) {
            const items = bot.inventory.items();
            if (items.length === 0) {
              bot.chat("My inventory is empty!");
            } else {
              const itemList = items.map(item => `${item.name}(${item.count})`).join(', ');
              bot.chat(`My inventory: ${itemList}`);
              console.log(`[BOT-${id}] Inventory contents: ${itemList}`);
            }
            return;
          }
          
          // Health status command
          if (lowerMessage === `${botNameLower} health` || lowerMessage === `${botNameLower} status`) {
            bot.chat(`Health: ${bot.health}/20, Food: ${bot.food}/20, Saturation: ${bot.foodSaturation.toFixed(1)}`);
            return;
          }
          
          // Sleep command
          if (lowerMessage.includes(`${botNameLower} sleep`)) {
            console.log(`[BOT-${id}] Received sleep command from ${username}`);
            bot.chat(`Looking for a bed to sleep in...`);
            findAndUseBed(bot, id);
            return;
          }
          
          // Chest search command: "botname find 10 diamond" or "botname search 5 iron_ingot"
          const searchPattern = new RegExp(`${botNameLower}\\s+(find|search)\\s+(\\d+)\\s+(.+)`, 'i');
          const searchMatch = lowerMessage.match(searchPattern);

          if (searchMatch) {
            const quantity = parseInt(searchMatch[2]);
            const itemName = searchMatch[3].trim();
            
            // Stop following if we're following someone
            if (botData.isFollowing) {
              stopFollowing(bot, id);
              bot.chat(`Stopping follow mode to search for items!`);
            }
            
            console.log(`[BOT-${id}] Received search command: looking for ${quantity}x ${itemName}`);
            bot.chat(`🔍 Starting search for ${quantity}x ${itemName}...`);
            
            // Start the chest search
            searchChestsForItem(bot, id, username, itemName, quantity);
            return;
          }

          // You can also add a simpler version without quantity (defaults to 1)
          const simpleSearchPattern = new RegExp(`${botNameLower}\\s+(find|search)\\s+(.+)`, 'i');
          const simpleSearchMatch = lowerMessage.match(simpleSearchPattern);

          if (simpleSearchMatch && !searchMatch) { // Only if the detailed pattern didn't match
            const itemName = simpleSearchMatch[2].trim();
            
            // Skip if it looks like it might be a number (to avoid conflicts)
            if (!/^\d+/.test(itemName)) {
              // Stop following if we're following someone
              if (botData.isFollowing) {
                stopFollowing(bot, id);
                bot.chat(`Stopping follow mode to search for items!`);
              }
              
              console.log(`[BOT-${id}] Received simple search command: looking for ${itemName}`);
              bot.chat(`🔍 Starting search for ${itemName}...`);
              
              // Start the chest search with quantity 1
              searchChestsForItem(bot, id, username, itemName, 1);
              return;
            }
          }
          
          // Check for coordinate command
          const coordPattern = new RegExp(`${botNameLower}\\s+(-?\\d+)\\s+(-?\\d+)\\s+(-?\\d+)`, 'i');
          const coordMatch = lowerMessage.match(coordPattern);
          
          if (coordMatch) {
            // Stop following if we get coordinate command
            if (botData.isFollowing) {
              stopFollowing(bot, id);
              bot.chat(`Stopped following to go to coordinates!`);
            }
            
            const x = parseInt(coordMatch[1]);
            const y = parseInt(coordMatch[2]);
            const z = parseInt(coordMatch[3]);
            
            // Store coordinates for reconnection
            botData.currentCoordinates = { x, y, z };
            
            console.log(`[BOT-${id}] Received coordinate command: going to ${x}, ${y}, ${z}`);
            bot.chat(`Going to coordinates ${x}, ${y}, ${z}!`);
            
            clearInterval(bot.wanderInterval);
            goToCoordinates(bot, id, x, y, z);
            return;
          }
          
          // Original name response
          if (lowerMessage.includes(botNameLower)) {
            const responses = [
              "Hi there! You called me?",
              "What's up?", 
              "Yes?",
              "I'm just wandering around...",
              "Here I am!",
              "Beep boop 🤖"
            ];
            const reply = responses[Math.floor(Math.random() * responses.length)];
            bot.chat(reply);
          }
        });

        // Random disconnect timer (5-7 minutes)
        const timeout = (Math.floor(Math.random() * (7 - 5 + 1)) + 5) * 60 * 1000;
        botData.reconnectTimeout = setTimeout(() => {
          console.log(`[BOT-${id}] Auto-disconnecting after ${(timeout / 60000).toFixed(1)} minutes for reconnect cycle.`);
          bot.quit('Auto disconnect for reconnect cycle');
        }, timeout);
      });

      bot.on('end', (reason) => {
        clearTimeout(botData.reconnectTimeout);
        console.log(`[BOT-${id}] Disconnected. Reason: ${reason || 'Unknown'}`);
        botData.status = 'connecting';
        
        // Auto-reconnect after 10 seconds if the bot should reconnect
        if (botData.shouldReconnect && activeBots.has(id)) {
          console.log(`[BOT-${id}] Reconnecting in 10 seconds...`);
          setTimeout(() => {
            if (activeBots.has(id) && botData.shouldReconnect) {
              console.log(`[BOT-${id}] Attempting to reconnect...`);
              connectBot();
            }
          }, 10000);
        } else {
          botData.status = 'offline';
          activeBots.delete(id);
        }
      });

      bot.on('error', (err) => {
        console.log(`[BOT-${id}] ERROR: ${err.message}`);
        
        if (err.code === 'ECONNRESET') {
          console.log(`[BOT-${id}] Connection reset by server.`);
        } else if (err.code === 'ECONNREFUSED') {
          console.log(`[BOT-${id}] Connection refused. Server might be offline.`);
        } else if (err.code === 'ETIMEDOUT') {
          console.log(`[BOT-${id}] Connection timeout.`);
        }
      });

      bot.on('login', () => {
        console.log(`[BOT-${id}] Logged in successfully as ${bot.username}`);
      });

      bot.on('kicked', (reason, loggedIn) => {
        console.log(`[BOT-${id}] Kicked from server: ${reason}`);
      });

    } catch (error) {
      console.log(`[BOT-${id}] Failed to create bot: ${error.message}`);
      botData.status = 'offline';
    }
  }
  
  // Initial connection
  connectBot();
  
  return botData;
}

function wanderAround(bot) {
  if (!bot || !bot.entity) return;
  
  bot.wanderInterval = setInterval(() => {
    if (!bot.entity || bot.usingHeldItem) {
      return;
    }
    
    const pos = bot.entity.position;
    const dx = (Math.random() - 0.5) * 1.2;
    const dz = (Math.random() - 0.5) * 1.2;
    const target = pos.offset(dx, 0, dz);
    
    bot.lookAt(target.offset(0, 1.5, 0));
    bot.setControlState('forward', true);
    if (Math.random() < 0.345613) bot.setControlState('jump', true); // NEW LINE

    
    setTimeout(() => {
      if (bot.entity) {
        bot.setControlState('forward', false);

      }
    }, 500 + Math.random() * 500);
    setTimeout(() => {
      if (bot.entity) {
        bot.setControlState('jump', false);
      }
    }, 1800);

  }, 3000 + Math.random() * 3000);

  // Clear interval when bot disconnects
  bot.on('end', () => {
    clearInterval(bot.wanderInterval);
  });
}

async function goToCoordinates(bot, botId, x, y, z) {
  if (!bot || !bot.entity) return;
  
  // Store coordinates in botData for reconnection
  const botData = activeBots.get(botId);
  if (botData) {
    botData.currentCoordinates = { x, y, z };
  }
  
  try {
    const defaultMove = new Movements(bot);
    
    // Enable swimming and sprinting
    defaultMove.canSwim = true;
    defaultMove.allowSprinting = true;
    
    // Add scaffolding blocks for building
    defaultMove.scaffoldingBlocks = [
      bot.registry.itemsByName.dirt?.id,
      bot.registry.itemsByName.cobblestone?.id,
      bot.registry.itemsByName.stone?.id,
      bot.registry.itemsByName.scaffolding?.id,
      bot.registry.itemsByName.oak_planks?.id
    ].filter(id => id !== undefined);
    
    // Add climbables (including scaffolding for proper climbing)
    if (bot.registry.blocksByName.ladder) {
      defaultMove.climbables.add(bot.registry.blocksByName.ladder.id);
    }
    if (bot.registry.blocksByName.vine) {
      defaultMove.climbables.add(bot.registry.blocksByName.vine.id);
    }
    if (bot.registry.blocksByName.scaffolding) {
      defaultMove.climbables.add(bot.registry.blocksByName.scaffolding.id);
    }
    
    defaultMove.liquidCost = 1;
    
    bot.pathfinder.setMovements(defaultMove);
    
    const goal = new GoalNear(x, y, z, 1);
    console.log(`[BOT-${botId}] Starting pathfind to ${x}, ${y}, ${z} (scaffolding climbing enabled)`);
    
    // Enhanced scaffolding movement handler
    const scaffoldingId = bot.registry.blocksByName.scaffolding?.id;
    let scaffoldingHandler;
    
    if (scaffoldingId) {
      scaffoldingHandler = setInterval(() => {
        if (!bot.entity) {
          clearInterval(scaffoldingHandler);
          return;
        }
        
        const currentBlock = bot.blockAt(bot.entity.position);
        const blockAbove = bot.blockAt(bot.entity.position.offset(0, 1, 0));
        const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0));
        
        const inScaffolding = currentBlock && currentBlock.type === scaffoldingId;
        const aboveScaffolding = blockAbove && blockAbove.type === scaffoldingId;
        const belowScaffolding = blockBelow && blockBelow.type === scaffoldingId;
        
        if (inScaffolding || aboveScaffolding || belowScaffolding) {
          const targetY = y;
          const currentY = bot.entity.position.y;
          
          if (targetY > currentY + 0.5) {
            bot.setControlState('jump', true);
            bot.setControlState('sneak', false);
          } 
          else if (targetY < currentY - 0.5) {
            bot.setControlState('sneak', true);
            bot.setControlState('jump', false);
          }
          else {
            bot.setControlState('jump', false);
            bot.setControlState('sneak', false);
          }
        }
      }, 50);
    }
    
    await bot.pathfinder.goto(goal);
    
    // Clean up
    if (scaffoldingHandler) {
      clearInterval(scaffoldingHandler);
    }
    bot.setControlState('jump', false);
    bot.setControlState('sneak', false);
    
    console.log(`[BOT-${botId}] Reached destination! Starting strict block wandering.`);
    bot.chat("I've arrived! Now staying exactly on this block.");
    
    // Start wandering on exact coordinates with strict block boundaries
    wanderAroundCoordinates(bot, botId, x, y, z);
    
  } catch (error) {
    console.log(`[BOT-${botId}] Pathfinding failed: ${error.message}`);
    bot.chat("Sorry, I couldn't reach those coordinates!");
    
    // Resume normal wandering
    wanderAround(bot);
  }
}

function wanderAroundCoordinates(bot, botId, centerX, centerY, centerZ) {
  if (!bot || !bot.entity) return;
  
  console.log(`[BOT-${botId}] Starting precise wandering - staying exactly on block ${centerX}, ${centerY}, ${centerZ}`);
  
  // Clear any existing wander interval
  if (bot.wanderInterval) {
    clearInterval(bot.wanderInterval);
  }
  
  bot.wanderInterval = setInterval(() => {
    if (!bot.entity || bot.usingHeldItem) {
      return;
    }
    
    const currentPos = bot.entity.position;
    const currentBlockX = Math.floor(currentPos.x);
    const currentBlockY = Math.floor(currentPos.y);
    const currentBlockZ = Math.floor(currentPos.z);
    
    // Check if we're still on the correct block and Y level
    if (currentBlockX !== centerX || currentBlockZ !== centerZ || currentBlockY !== centerY) {
      console.log(`[BOT-${botId}] Bot moved off target block! Current: ${currentBlockX},${currentBlockY},${currentBlockZ} Target: ${centerX},${centerY},${centerZ}`);
      
      // Move back to exact center of target block
      const targetPos = bot.entity.position.offset(
        centerX + 0.5 - currentPos.x,
        0, // Changed from 0.1 to 0
        centerZ + 0.5 - currentPos.z
      );
      
      // Look towards target and move back
      bot.lookAt(targetPos.offset(0, 1.5, 0));
      bot.setControlState('forward', true);
      if (Math.random() < 0.345613) bot.setControlState('jump', true); // NEW LINE

      
      setTimeout(() => {
        if (bot.entity) {
          bot.setControlState('forward', false);
        }
      }, 200);
      setTimeout(() => {
        if (bot.entity) {
          bot.setControlState('jump', false);
        }
      }, 1000);
      return;
    }
    
    // We're on the correct block - make tiny movements within the same block only
    const blockCenterX = centerX + 0.5;
    const blockCenterZ = centerZ + 0.5;
    
    // Calculate how far we are from block center
    const distFromCenterX = currentPos.x - blockCenterX;
    const distFromCenterZ = currentPos.z - blockCenterZ;
    
    // If we're close to the edge, move back toward center
    if (Math.abs(distFromCenterX) > 0.35 || Math.abs(distFromCenterZ) > 0.35) {
      console.log(`[BOT-${botId}] Too close to block edge, moving back to center`);
      const centerTarget = currentPos.offset(
        blockCenterX - currentPos.x,
        0,
        blockCenterZ - currentPos.z
      );
      bot.lookAt(centerTarget.offset(0, 1.5, 0));
      bot.setControlState('forward', true);
      if (Math.random() < 0.345613) bot.setControlState('jump', true); // NEW LINE

      setTimeout(() => {
        if (bot.entity) {
          bot.setControlState('forward', false);
        }
      }, 100);
      setTimeout(() => {
      if (bot.entity) {
        bot.setControlState('jump', false);
      }
    }, 1000);
    } else {
      // Make a tiny random movement within the block
      if (Math.random() < 0.4) {
        const randomAngle = Math.random() * Math.PI * 2;
        const moveDistance = 0.1 + Math.random() * 0.1; // Very small movement
        
        const targetX = currentPos.x + Math.cos(randomAngle) * moveDistance;
        const targetZ = currentPos.z + Math.sin(randomAngle) * moveDistance;
        
        // Ensure the movement stays within the same block
        const targetBlockX = Math.floor(targetX);
        const targetBlockZ = Math.floor(targetZ);
        
        if (targetBlockX === centerX && targetBlockZ === centerZ) {
          const moveTarget = currentPos.offset(
            targetX - currentPos.x,
            0,
            targetZ - currentPos.z
          );
          bot.lookAt(moveTarget.offset(0, 1.5, 0));
          bot.setControlState('forward', true);
          if (Math.random() < 0.345613) bot.setControlState('jump', true); // NEW LINE

          
          setTimeout(() => {
            if (bot.entity) {
              bot.setControlState('forward', false);
            }
          }, 50 + Math.random() * 100);
          setTimeout(() => {
            if (bot.entity) {
              bot.setControlState('jump', false);
            }
          }, 1800);
        }
      } else {
        // Just look around randomly while staying in place
        const randomYaw = Math.random() * Math.PI * 2;
        const randomPitch = (Math.random() - 0.5) * 0.3;
        bot.look(randomYaw, randomPitch);
      }
    }
    
  }, 1000 + Math.random() * 2000); // Check every 1-3 seconds

  // Clear interval when bot disconnects
  bot.on('end', () => {
    if (bot.wanderInterval) {
      clearInterval(bot.wanderInterval);
    }
  });
}

// HELPER FUNCTION: Find water surface
function findWaterSurface(bot, position) {
  const waterIds = [
    bot.registry.blocksByName.water?.id,
    bot.registry.blocksByName.flowing_water?.id
  ].filter(id => id !== undefined);
  
  for (let y = Math.floor(position.y); y < position.y + 10; y++) {
    const block = bot.blockAt(position.offset(0, y - position.y, 0));
    if (!block || !waterIds.includes(block.type)) {
      return y;
    }
  }
  return null;
}

function checkAndEat(bot, botId) {
  if (bot.usingHeldItem) {
    return;
  }
  
  if (bot.health < 15 || bot.food < 16) {
    console.log(`[BOT-${botId}] Bot needs food! Health: ${bot.health}, Food: ${bot.food}`);
    eatFood(bot, botId);
  }
}

function startFollowing(bot, botId, targetUsername) {
  const botData = activeBots.get(botId);
  if (!botData) return;
  
  console.log(`[BOT-${botId}] Starting to follow ${targetUsername}`);
  
  // Clear any existing follow interval
  if (botData.followInterval) {
    clearInterval(botData.followInterval);
  }
  
  // Store current pathfinding promise to handle cancellation
  let currentPathfinding = null;
  
  botData.followInterval = setInterval(async () => {
    if (!bot.entity || !botData.isFollowing) {
      return;
    }
    
    const targetPlayer = bot.players[targetUsername];
    if (!targetPlayer || !targetPlayer.entity) {
      console.log(`[BOT-${botId}] Lost sight of ${targetUsername}, stopping follow`);
      bot.chat(`I lost sight of you, ${targetUsername}! Stopping follow.`);
      stopFollowing(bot, botId);
      return;
    }
    
    const botPos = bot.entity.position;
    const targetPos = targetPlayer.entity.position;
    const distance = botPos.distanceTo(targetPos);
    
    // Follow if target is more than 3 blocks away
    if (distance > 3) {
      try {
        console.log(`[BOT-${botId}] Following ${targetUsername} - distance: ${distance.toFixed(2)}`);
        
        // Cancel any existing pathfinding to prevent GoalChanged errors
        if (currentPathfinding) {
          try {
            bot.pathfinder.setGoal(null);
          } catch (e) {
            // Ignore goal cancellation errors
          }
        }
        
        const defaultMove = new Movements(bot);
        defaultMove.canSwim = true;
        defaultMove.allowSprinting = true;
        
        // Add scaffolding blocks for building
        defaultMove.scaffoldingBlocks = [
          bot.registry.itemsByName.dirt?.id,
          bot.registry.itemsByName.cobblestone?.id,
          bot.registry.itemsByName.stone?.id,
          bot.registry.itemsByName.scaffolding?.id,
          bot.registry.itemsByName.oak_planks?.id
        ].filter(id => id !== undefined);
        
        // Add climbables
        if (bot.registry.blocksByName.ladder) {
          defaultMove.climbables.add(bot.registry.blocksByName.ladder.id);
        }
        if (bot.registry.blocksByName.vine) {
          defaultMove.climbables.add(bot.registry.blocksByName.vine.id);
        }
        if (bot.registry.blocksByName.scaffolding) {
          defaultMove.climbables.add(bot.registry.blocksByName.scaffolding.id);
        }
        
        defaultMove.liquidCost = 1;
        bot.pathfinder.setMovements(defaultMove);
        
        // Follow to within 2 blocks of the target
        const goal = new GoalNear(targetPos.x, targetPos.y, targetPos.z, 2);
        
        // Start new pathfinding
        currentPathfinding = bot.pathfinder.goto(goal).catch(error => {
          // Handle pathfinding errors gracefully
          if (error.message.includes('GoalChanged')) {
            console.log(`[BOT-${botId}] Goal changed while following - this is normal`);
          } else if (error.message.includes('NoPath')) {
            console.log(`[BOT-${botId}] No path found to ${targetUsername}, trying to get closer`);
          } else {
            console.log(`[BOT-${botId}] Pathfinding error: ${error.message}`);
          }
        });
        
      } catch (error) {
        console.log(`[BOT-${botId}] Error while following: ${error.message}`);
      }
    }
    // If close enough (within 3 blocks), just look at the target
    else if (distance <= 3) {
      try {
        bot.lookAt(targetPos.offset(0, 1.6, 0));
      } catch (lookError) {
        console.log(`[BOT-${botId}] Error looking at target: ${lookError.message}`);
      }
    }
    
  }, 2000); // Increased to 2 seconds to reduce goal conflicts
  
  // Clean up on disconnect
  bot.on('end', () => {
    if (botData.followInterval) {
      clearInterval(botData.followInterval);
      botData.followInterval = null;
    }
    currentPathfinding = null;
  });
}

function stopFollowing(bot, botId) {
  const botData = activeBots.get(botId);
  if (!botData) return;
  
  console.log(`[BOT-${botId}] Stopping follow mode`);
  
  botData.isFollowing = false;
  botData.followTarget = null;
  
  if (botData.followInterval) {
    clearInterval(botData.followInterval);
    botData.followInterval = null;
  }
  
  // Stop any current pathfinding
  bot.pathfinder.setGoal(null);
  
  // Resume normal wandering
  setTimeout(() => {
    if (bot.entity && !botData.currentCoordinates) {
      wanderAround(bot);
    }
  }, 1000);
}

async function searchChestsForItem(bot, botId, username, itemName, quantity) {
  if (!bot || !bot.entity) {
    console.log(`[BOT-${botId}] Bot not available for chest search`);
    return;
  }

  const requestedQuantity = parseInt(quantity) || 1;
  console.log(`[BOT-${botId}] Starting chest search for ${requestedQuantity}x ${itemName} requested by ${username}`);
  
  bot.chat(`🔍 Searching for ${requestedQuantity}x ${itemName} in nearby chests...`);
  
  // Stop current activities
  if (bot.wanderInterval) {
    clearInterval(bot.wanderInterval);
  }
  bot.pathfinder.setGoal(null);
  
  const botPos = bot.entity.position;
  const searchRadius = 50;
  const chestBlockTypes = [
    bot.registry.blocksByName.chest?.id,
    bot.registry.blocksByName.trapped_chest?.id,
    bot.registry.blocksByName.ender_chest?.id,
    bot.registry.blocksByName.barrel?.id,
    bot.registry.blocksByName.shulker_box?.id
  ].filter(id => id !== undefined);

  console.log(`[BOT-${botId}] Using findBlocks method to locate chests...`);

  // Use bot.findBlocks instead of manual scanning
  const chestPositions = bot.findBlocks({
    matching: (block) => {
      return chestBlockTypes.includes(block.type) && 
             (!block.getProperties || 
              !block.getProperties().type || 
              block.getProperties().type === 'single' || 
              block.getProperties().type === 'right');
    },
    useExtraInfo: true,
    maxDistance: searchRadius,
    count: 100
  });

  const chestsFound = chestPositions.map(pos => {
    const block = bot.blockAt(pos);
    const distance = botPos.distanceTo(pos);
    return {
      block: block,
      position: { x: pos.x, y: pos.y, z: pos.z },
      distance: distance,
      type: block.name
    };
  });

  console.log(`[BOT-${botId}] Found ${chestsFound.length} chests/containers in ${searchRadius} block radius`);
  
  if (chestsFound.length === 0) {
    bot.chat(`❌ No chests found within ${searchRadius} blocks!`);
    resumeNormalActivity(bot, botId);
    return;
  }

  bot.chat(`📦 Found ${chestsFound.length} containers, checking contents...`);

  // Sort chests by distance (closest first)
  chestsFound.sort((a, b) => a.distance - b.distance);

  let totalItemsFound = 0;
  let totalItemsCollected = 0;
  const chestsWithItems = [];
  let successfulChestSearches = 0;

  // Search each chest
  for (const chestInfo of chestsFound) {
    if (totalItemsCollected >= requestedQuantity) {
      break; // We have enough items
    }

    try {
      console.log(`[BOT-${botId}] Moving to chest at ${chestInfo.position.x}, ${chestInfo.position.y}, ${chestInfo.position.z} (${chestInfo.distance.toFixed(1)} blocks away)`);
      
      // Move to chest
      const defaultMove = new Movements(bot);
      defaultMove.canSwim = true;
      defaultMove.allowSprinting = true;
      bot.pathfinder.setMovements(defaultMove);
      
      const goal = new GoalNear(chestInfo.position.x, chestInfo.position.y, chestInfo.position.z, 1);
      await bot.pathfinder.goto(goal);
      
      console.log(`[BOT-${botId}] Reached chest, attempting to open...`);
      
      // Open the chest
      const chest = await bot.openContainer(chestInfo.block);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for chest to load
      successfulChestSearches++;
      
      console.log(`[BOT-${botId}] Opened ${chestInfo.type}, scanning contents...`);
      
      // Search for the item in this chest
      const items = chest.containerItems(); // Use containerItems() instead of items()
      let itemsInThisChest = 0;

      for (const item of items) {
        // More flexible item matching
        const itemNameLower = item.name.toLowerCase().replace(/_/g, ' ');
        const searchNameLower = itemName.toLowerCase().replace(/_/g, ' ');
        
        if (itemNameLower.includes(searchNameLower) || 
            searchNameLower.includes(itemNameLower) ||
            item.name.toLowerCase() === itemName.toLowerCase() ||
            item.displayName?.toLowerCase().includes(searchNameLower)) {
          itemsInThisChest += item.count;
          totalItemsFound += item.count;
          console.log(`[BOT-${botId}] Matched item: ${item.name} (${item.count}) - searched for: ${itemName}`);
        }
      }
      
      if (itemsInThisChest > 0) {
        console.log(`[BOT-${botId}] Found ${itemsInThisChest}x ${itemName} in this chest`);
        chestsWithItems.push({
          position: chestInfo.position,
          quantity: itemsInThisChest,
          type: chestInfo.type
        });
        
        // Take items from this chest
        const itemsToTake = Math.min(itemsInThisChest, requestedQuantity - totalItemsCollected);
        let itemsTakenFromChest = 0;
        
        for (const item of items) {
          if (itemsTakenFromChest >= itemsToTake) break;
          
          // Same flexible matching as above
          const itemNameLower = item.name.toLowerCase().replace(/_/g, ' ');
          const searchNameLower = itemName.toLowerCase().replace(/_/g, ' ');
          
          if (itemNameLower.includes(searchNameLower) || 
              searchNameLower.includes(itemNameLower) ||
              item.name.toLowerCase() === itemName.toLowerCase() ||
              item.displayName?.toLowerCase().includes(searchNameLower)) {
            
            const quantityToTake = Math.min(item.count, itemsToTake - itemsTakenFromChest);
            
            try {
              await chest.withdraw(item.type, null, quantityToTake);
              itemsTakenFromChest += quantityToTake;
              totalItemsCollected += quantityToTake;
              console.log(`[BOT-${botId}] Successfully took ${quantityToTake}x ${item.name} from chest`);
            } catch (withdrawError) {
              console.log(`[BOT-${botId}] Error taking ${item.name}: ${withdrawError.message}`);
            }
          }
        }
      }
      
      // Close the chest
      chest.close();
      
      // Small delay between chests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`[BOT-${botId}] Error with chest at ${chestInfo.position.x},${chestInfo.position.y},${chestInfo.position.z}: ${error.message}`);
      // Continue to next chest
    }
  }

  // Report results
  console.log(`[BOT-${botId}] Chest search completed. Checked ${successfulChestSearches}/${chestsFound.length} containers`);
  
  if (totalItemsCollected === 0) {
    bot.chat(`❌ Sorry ${username}, I couldn't find any "${itemName}" in ${successfulChestSearches} containers I checked!`);
  } else if (totalItemsCollected < requestedQuantity) {
    bot.chat(`⚠️ ${username}, I found ${totalItemsCollected}/${requestedQuantity} "${itemName}" from ${chestsWithItems.length} containers. That's all I could find!`);
    
    // Try to give items to player
    await giveItemsToPlayer(bot, botId, username, itemName);
  } else {
    bot.chat(`✅ ${username}, I collected ${totalItemsCollected}x "${itemName}" from ${chestsWithItems.length} containers!`);
    
    // Try to give items to player
    await giveItemsToPlayer(bot, botId, username, itemName);
  }

  // Resume normal activity
  setTimeout(() => {
    resumeNormalActivity(bot, botId);
  }, 2000);
}

async function giveItemsToPlayer(bot, botId, username, itemName) {
  try {
    const targetPlayer = bot.players[username];
    if (!targetPlayer || !targetPlayer.entity) {
      bot.chat(`${username}, I have your items but I can't see you! Come closer so I can give them to you.`);
      return;
    }

    const botPos = bot.entity.position;
    const playerPos = targetPlayer.entity.position;
    const distance = botPos.distanceTo(playerPos);

    // Move closer to player if too far
    if (distance > 4) {
      console.log(`[BOT-${botId}] Moving closer to ${username} to give items (distance: ${distance.toFixed(1)})`);
      bot.chat(`${username}, coming to you to give the items...`);
      
      const defaultMove = new Movements(bot);
      defaultMove.canSwim = true;
      defaultMove.allowSprinting = true;
      bot.pathfinder.setMovements(defaultMove);
      
      const goal = new GoalNear(playerPos.x, playerPos.y, playerPos.z, 2);
      await bot.pathfinder.goto(goal);
    }

    // Find the items in bot's inventory
    const inventoryItems = bot.inventory.items();
    const itemsToGive = inventoryItems.filter(item => {
      const itemNameNormalized = item.name.toLowerCase().replace(/_/g, ' ');
      const searchNameNormalized = itemName.toLowerCase().replace(/_/g, ' ');
      return itemNameNormalized.includes(searchNameNormalized) || 
             searchNameNormalized.includes(itemNameNormalized) ||
             item.name.toLowerCase().includes(itemName.toLowerCase()) || 
             itemName.toLowerCase().includes(item.name.toLowerCase());
    });

    if (itemsToGive.length === 0) {
      bot.chat(`${username}, it seems I don't have any "${itemName}" in my inventory anymore!`);
      return;
    }

    bot.chat(`${username}, I'm dropping your items now!`);
    
    // Drop the items near the player
    for (const item of itemsToGive) {
      try {
        await bot.toss(item.type, null, item.count);
        console.log(`[BOT-${botId}] Dropped ${item.count}x ${item.name} for ${username}`);
      } catch (tossError) {
        console.log(`[BOT-${botId}] Error dropping ${item.name}: ${tossError.message}`);
      }
    }
    
    bot.chat(`📦 ${username}, I've dropped all your "${itemName}" items! Please pick them up.`);
    
  } catch (error) {
    console.log(`[BOT-${botId}] Error giving items to player: ${error.message}`);
    bot.chat(`${username}, I have your items but there was an error giving them to you. They're in my inventory.`);
  }
}

function resumeNormalActivity(bot, botId) {
  const botData = activeBots.get(botId);
  if (!botData) return;
  
  // Resume following if we were following someone
  if (botData.isFollowing && botData.followTarget) {
    console.log(`[BOT-${botId}] Resuming following ${botData.followTarget}`);
    const targetPlayer = bot.players[botData.followTarget];
    if (targetPlayer && targetPlayer.entity) {
      startFollowing(bot, botId, botData.followTarget);
    } else {
      botData.isFollowing = false;
      botData.followTarget = null;
      wanderAround(bot);
    }
  }
  // Resume coordinate mode if we had coordinates
  else if (botData.currentCoordinates) {
    const { x, y, z } = botData.currentCoordinates;
    console.log(`[BOT-${botId}] Resuming coordinate wandering at ${x}, ${y}, ${z}`);
    setTimeout(() => {
      goToCoordinates(bot, botId, x, y, z);
    }, 1000);
  }
  // Otherwise just wander normally
  else {
    console.log(`[BOT-${botId}] Resuming normal wandering`);
    wanderAround(bot);
  }
}

async function findAndUseBed(bot, botId) {
  if (!bot || !bot.entity) {
    console.log(`[BOT-${botId}] Bot not available for sleep`);
    return;
  }

  console.log(`[BOT-${botId}] Searching for beds...`);
  
  const botPos = bot.entity.position;
  const searchRadius = 50;
  
  // All bed types
  const bedBlockTypes = [
    'white_bed', 'orange_bed', 'magenta_bed', 'light_blue_bed', 'yellow_bed',
    'lime_bed', 'pink_bed', 'gray_bed', 'light_gray_bed', 'cyan_bed',
    'purple_bed', 'blue_bed', 'brown_bed', 'green_bed', 'red_bed', 'black_bed'
  ].map(bedName => bot.registry.blocksByName[bedName]?.id).filter(id => id !== undefined);

  if (bedBlockTypes.length === 0) {
    bot.chat(`❌ No bed blocks found in registry!`);
    return;
  }

  // Find beds using bot.findBlocks
  const bedPositions = bot.findBlocks({
    matching: (block) => {
      return bedBlockTypes.includes(block.type) && 
             (!block.getProperties || 
              !block.getProperties().part || 
              block.getProperties().part === 'head'); // Only target bed head
    },
    useExtraInfo: true,
    maxDistance: searchRadius,
    count: 20
  });

  const bedsFound = bedPositions.map(pos => {
    const block = bot.blockAt(pos);
    const distance = botPos.distanceTo(pos);
    return {
      block: block,
      position: { x: pos.x, y: pos.y, z: pos.z },
      distance: distance,
      type: block.name
    };
  });

  console.log(`[BOT-${botId}] Found ${bedsFound.length} beds in ${searchRadius} block radius`);
  
  if (bedsFound.length === 0) {
    bot.chat(`❌ No beds found within ${searchRadius} blocks!`);
    return;
  }

  // Sort beds by distance (closest first)
  bedsFound.sort((a, b) => a.distance - b.distance);
  const nearestBed = bedsFound[0];

  bot.chat(`🛏️ Found bed ${nearestBed.distance.toFixed(1)} blocks away, going to sleep...`);

  try {
    console.log(`[BOT-${botId}] Moving to bed at ${nearestBed.position.x}, ${nearestBed.position.y}, ${nearestBed.position.z}`);
    
    // Stop current activities
    if (bot.wanderInterval) {
      clearInterval(bot.wanderInterval);
    }
    bot.pathfinder.setGoal(null);
    
    // Move to bed
    const defaultMove = new Movements(bot);
    defaultMove.canSwim = true;
    defaultMove.allowSprinting = true;
    bot.pathfinder.setMovements(defaultMove);
    
    const goal = new GoalNear(nearestBed.position.x, nearestBed.position.y, nearestBed.position.z, 1);
    await bot.pathfinder.goto(goal);
    
    console.log(`[BOT-${botId}] Reached bed, attempting to sleep...`);
    
    // Look at the bed
    const bedPos = nearestBed.block.position;
    await bot.lookAt(bedPos.offset(0.5, 0.5, 0.5));
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to sleep (right-click the bed)
    try {
      await bot.sleep(nearestBed.block);
      console.log(`[BOT-${botId}] Successfully started sleeping!`);
      bot.chat(`😴 Going to sleep... Good night!`);
      
      // Wait for sleep to complete or be interrupted
      bot.once('wake', () => {
        console.log(`[BOT-${botId}] Woke up from sleep`);
        bot.chat(`🌅 Good morning! I'm awake now.`);
        
        // Resume normal activity after a short delay
        setTimeout(() => {
          resumeNormalActivity(bot, botId);
        }, 2000);
      });
      
    } catch (sleepError) {
      console.log(`[BOT-${botId}] Error trying to sleep: ${sleepError.message}`);
      
      if (sleepError.message.includes('Cannot sleep')) {
        bot.chat(`❌ Can't sleep right now! (Maybe it's not night time or bed is occupied)`);
      } else if (sleepError.message.includes('Too far')) {
        bot.chat(`❌ I'm too far from the bed to sleep!`);
      } else {
        bot.chat(`❌ Failed to sleep: ${sleepError.message}`);
      }
      
      // Resume normal activity
      setTimeout(() => {
        resumeNormalActivity(bot, botId);
      }, 2000);
    }
    
  } catch (pathError) {
    console.log(`[BOT-${botId}] Error reaching bed: ${pathError.message}`);
    bot.chat(`❌ Couldn't reach the bed!`);
    
    // Resume normal activity
    setTimeout(() => {
      resumeNormalActivity(bot, botId);
    }, 2000);
  }
}

async function eatFood(bot, botId) {
  if (!bot || !bot.inventory || bot.usingHeldItem) {
    return;
  }

  // Expanded food list including more items that might be in inventory
  const foodItems = [
    // Best foods (highest priority)
    'golden_apple', 'enchanted_golden_apple', 'golden_carrot',
    // Cooked meats
    'cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'cooked_mutton', 
    'cooked_salmon', 'cooked_cod', 'cooked_rabbit',
    // Good foods
    'baked_potato', 'bread', 'cake', 'pumpkin_pie', 'rabbit_stew', 
    'mushroom_stew', 'beetroot_soup', 'suspicious_stew',
    // Decent foods
    'cookie', 'apple', 'carrot', 'potato', 'beetroot', 'melon_slice', 
    'sweet_berries', 'glow_berries', 'honey_bottle',
    // Raw foods (lower priority but still edible)
    'beef', 'porkchop', 'chicken', 'mutton', 'rabbit', 'salmon', 'cod',
    // Other foods
    'tropical_fish', 'pufferfish', 'spider_eye', 'rotten_flesh',
    'poisonous_potato', 'chorus_fruit', 'dried_kelp'
  ];

  let foodItem = null;
  try {
    // Debug: List all items in inventory
    const allItems = bot.inventory.items();
    console.log(`[BOT-${botId}] Inventory items: ${allItems.map(item => `${item.name}(${item.count})`).join(', ')}`);
    
    for (const foodName of foodItems) {
      foodItem = allItems.find(item => item.name === foodName);
      if (foodItem) {
        console.log(`[BOT-${botId}] Found ${foodName} (${foodItem.count}) in inventory - attempting to eat`);
        break;
      }
    }
    
    // If no specific food found, try to find any item that can be consumed
    if (!foodItem) {
      foodItem = allItems.find(item => {
        try {
          // Check if item has food properties
          return item.food && item.food > 0;
        } catch (e) {
          return false;
        }
      });
      
      if (foodItem) {
        console.log(`[BOT-${botId}] Found consumable item: ${foodItem.name}`);
      }
    }
    
  } catch (err) {
    console.log(`[BOT-${botId}] Error accessing inventory: ${err.message}`);
    return;
  }

  if (!foodItem) {
    console.log(`[BOT-${botId}] No food found in inventory. Available items: ${bot.inventory.items().map(i => i.name).join(', ')}`);
    return;
  }

  try {
    console.log(`[BOT-${botId}] Attempting to equip and consume ${foodItem.name}...`);
    
    // First try to equip the food item
    await bot.equip(foodItem, 'hand');
    console.log(`[BOT-${botId}] Equipped ${foodItem.name}, now consuming...`);
    
    // Try the consume method first
    await bot.consume();
    console.log(`[BOT-${botId}] Successfully consumed ${foodItem.name}! Health: ${bot.health}, Food: ${bot.food}`);
    
  } catch (err) {
    console.log(`[BOT-${botId}] Error with consume method: ${err.message}`);
    
    try {
      console.log(`[BOT-${botId}] Trying fallback method: manual activation`);
      
      // Fallback: manually activate item
      bot.activateItem();
      
      // Hold for eating duration
      setTimeout(() => {
        try {
          bot.deactivateItem();
          console.log(`[BOT-${botId}] Finished eating ${foodItem.name} (fallback method)`);
        } catch (deactivateErr) {
          console.log(`[BOT-${botId}] Error deactivating item: ${deactivateErr.message}`);
        }
      }, 1600); // Standard eating time
      
    } catch (fallbackErr) {
      console.log(`[BOT-${botId}] All eating methods failed: ${fallbackErr.message}`);
    }
  }
}

// Periodic health check for all bots
setInterval(() => {
  activeBots.forEach((botData, id) => {
    const bot = botData.bot;
    if (bot && bot.entity && bot.health !== undefined) {
      checkAndEat(bot, id);
    }
  });
}, 30000);

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n[SERVER] Received SIGINT, gracefully shutting down...');
  
  activeBots.forEach((botData, id) => {
    if (botData.bot) {
      botData.bot.quit('Server shutting down');
    }
  });
  
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`[SERVER] Minecraft Bot Manager running on http://localhost:${PORT}`);
  console.log(`[SERVER] Open your browser and navigate to the URL above to manage your bots!`);
});
