/**
 * index.js
 */
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const QRCode = require('qrcode');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();  // Add this line to load .env file

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Add logging middleware
app.use(morgan(':remote-addr - :method :url :status :response-time ms'));

// Track IPs and their drawn concepts
const userDraws = new Map();

// Middleware to get IPv4 address and check previous draws
const getIPv4 = (req, res, next) => {
  let ip = req.ip;
  
  // Special handling for localhost
  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  // Handle potential IPv6 format like ::ffff:192.168.1.1
  else if (ip.includes('::ffff:')) {
    ip = ip.split(':').pop();
  }
  
  // If still not IPv4, reject the request
  if (!ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return res.status(400).json({ error: 'IPv4 address required' });
  }
  
  req.ipv4 = ip;
  next();
};

// Organize concepts by type with their associated colors
const conceptTypes = {
  timor: {
    color: '#00AB55', // green
    concepts: ['Matak', 'Matak', 'Matak']
  },
  entrepreneurship: {
    color: '#2065D1', // blue
    concepts: ['Azul', 'Azul', 'Azul']
  },
  youth: {
    color: '#000000', // black
    concepts: ['Metan', 'Metan', 'Metan']
  },
  sustainability: {
    color: '#FFB400', // yellow
    concepts: ['Kinur', 'Kinur', 'Kinur']
  },
  health: {
    color: '#FF0000', // red
    concepts: ['Mean', 'Mean', 'Mean']
  }
};

// Flatten concepts for drawing while keeping track of their type
let concepts = Object.entries(conceptTypes).flatMap(([type, data]) => 
  data.concepts.map(concept => ({ concept, type }))
);

// Uncomment and modify the static files middleware
app.use(express.static('public'));

// Route: Home page – serves a simple HTML with a button to pick a color
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add new route to check user's status
app.get('/status', getIPv4, (req, res) => {
  const userIP = req.ipv4;
  const previousDraw = userDraws.get(userIP);
  
  if (previousDraw) {
    res.json({
      drawn: true,
      ...previousDraw
    });
  } else {
    res.json({
      drawn: false,
      remaining: concepts.length
    });
  }
});

// Add monitoring endpoint for facilitators
app.get('/monitor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'monitor.html'));
});

// Add API endpoint for monitoring data
app.get('/api/monitor', (req, res) => {
  const participants = Array.from(userDraws.entries()).map(([ip, data]) => ({
    ip,
    concept: data.concept,
    type: data.type,
    color: data.color,
    timestamp: data.timestamp || 'Unknown'
  }));
  
  const stats = {
    totalParticipants: participants.length,
    remainingConcepts: concepts.length,
    totalConcepts: 15, // 3 concepts per category × 5 categories
    categoryStats: {
      timor: participants.filter(p => p.type === 'timor').length,
      entrepreneurship: participants.filter(p => p.type === 'entrepreneurship').length,
      youth: participants.filter(p => p.type === 'youth').length,
      sustainability: participants.filter(p => p.type === 'sustainability').length,
      health: participants.filter(p => p.type === 'health').length
    }
  };
  
  res.json({
    participants,
    stats
  });
});

// Update draw route to store results
app.get('/draw', getIPv4, (req, res) => {
  const userIP = req.ipv4;
  
  // Check if user has already drawn
  const previousDraw = userDraws.get(userIP);
  if (previousDraw) {
    console.log(`[${new Date().toISOString()}] User ${userIP} attempted to draw again but was blocked`);
    return res.status(403).json({ 
      error: 'You have already drawn a concept',
      remaining: concepts.length
    });
  }
  
  if (concepts.length === 0) {
    console.log(`[${new Date().toISOString()}] User ${userIP} attempted to draw, but no concepts remain`);
    return res.json({ concept: null });
  }
  
  const randomIndex = Math.floor(Math.random() * concepts.length);
  const selectedItem = concepts.splice(randomIndex, 1)[0];
  
  // Store the user's draw
  const drawResult = {
    concept: selectedItem.concept,
    type: selectedItem.type,
    color: conceptTypes[selectedItem.type].color,
    remaining: concepts.length,
    timestamp: new Date().toISOString()
  };
  userDraws.set(userIP, drawResult);
  
  console.log(`[${new Date().toISOString()}] User ${userIP} drew concept: "${selectedItem.concept}". ${concepts.length} concepts remaining`);
  
  // Emit real-time update to monitoring clients
  io.emit('participantDraw', {
    ip: userIP,
    concept: selectedItem.concept,
    type: selectedItem.type,
    color: conceptTypes[selectedItem.type].color,
    timestamp: drawResult.timestamp,
    remaining: concepts.length
  });
  
  res.json(drawResult);
});

// Test route that allows unlimited draws
app.get('/test/draw', getIPv4, (req, res) => {
  const userIP = req.ipv4;
  
  if (concepts.length === 0) {
    console.log(`[${new Date().toISOString()}] Test user ${userIP} attempted to draw, but no concepts remain`);
    return res.json({ concept: null });
  }
  
  const randomIndex = Math.floor(Math.random() * concepts.length);
  const selectedItem = concepts.splice(randomIndex, 1)[0];
  
  const drawResult = {
    concept: selectedItem.concept,
    type: selectedItem.type,
    color: conceptTypes[selectedItem.type].color,
    remaining: concepts.length
  };
  
  console.log(`[${new Date().toISOString()}] Test user ${userIP} drew concept: "${selectedItem.concept}". ${concepts.length} concepts remaining`);
  
  res.json(drawResult);
});

// Serve the test page
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Generate QR code when server starts
async function generateQRCode() {
  const serverUrl = `http://${HOST}:${PORT}`;
  try {
    // Generate QR code and save it to public directory
    await QRCode.toFile(
      path.join(__dirname, 'public', 'qr.png'),
      serverUrl,
      {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }
    );
    console.log(`QR Code generated for ${serverUrl}/qr`);
  } catch (err) {
    console.error('Failed to generate QR code:', err);
  }
}

// Generate WiFi QR code when server starts
async function generateWiFiQRCode() {
  try {
    const { WIFI_SSID, WIFI_PASSWORD, WIFI_ENCRYPTION = 'WPA' } = process.env;
    
    if (!WIFI_SSID || !WIFI_PASSWORD) {
      console.error('WiFi QR Code generation skipped: Missing WIFI_SSID or WIFI_PASSWORD in .env');
      return;
    }

    // WiFi QR code format: WIFI:T:<encryption>;S:<ssid>;P:<password>;;
    const wifiString = `WIFI:T:${WIFI_ENCRYPTION};S:${WIFI_SSID};P:${WIFI_PASSWORD};;`;
    
    await QRCode.toFile(
      path.join(__dirname, 'public', 'wifi.png'),
      wifiString,
      {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }
    );
    console.log(`WiFi QR Code generated for ${HOST}:${PORT}/wifi`);
  } catch (err) {
    console.error('Failed to generate WiFi QR code:', err);
  }
}

// Add route to serve QR code page
app.get('/qr', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qr.html'));
});

// Add route to serve WiFi QR code page
app.get('/wifi', (req, res) => {
  if (!process.env.WIFI_SSID || !process.env.WIFI_PASSWORD) {
    return res.status(404).send('WiFi configuration not available');
  }
  res.sendFile(path.join(__dirname, 'public', 'wifi.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Monitor client connected: ${socket.id}`);
  
  // Send initial data when a monitor client connects
  socket.emit('initialData', {
    participants: Array.from(userDraws.entries()).map(([ip, data]) => ({
      ip,
      concept: data.concept,
      type: data.type,
      color: data.color,
      timestamp: data.timestamp || 'Unknown'
    })),
    stats: {
      totalParticipants: userDraws.size,
      remainingConcepts: concepts.length,
      totalConcepts: 15,
      categoryStats: {
        timor: Array.from(userDraws.values()).filter(d => d.type === 'timor').length,
        entrepreneurship: Array.from(userDraws.values()).filter(d => d.type === 'entrepreneurship').length,
        youth: Array.from(userDraws.values()).filter(d => d.type === 'youth').length,
        sustainability: Array.from(userDraws.values()).filter(d => d.type === 'sustainability').length,
        health: Array.from(userDraws.values()).filter(d => d.type === 'health').length
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Monitor client disconnected: ${socket.id}`);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
  console.log(`Monitor dashboard available at http://${HOST}:${PORT}/monitor`);
  generateQRCode();
  generateWiFiQRCode();
});
