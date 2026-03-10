// Simple HTTP Server for Sewage Gas Dashboard
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const PUBLIC_DIR = __dirname;

// ThingSpeak Configuration
const THINGSPEAK_CHANNEL_ID = '3277165';
const THINGSPEAK_READ_API_KEY = 'MWUXOBPOKXDK7TI5';

// Mobile Notification System
const notifications = require('./notifications.js');

// Safety check interval (check every 60 seconds)
const SAFETY_CHECK_INTERVAL = 60000;

// Status report interval (1 hour = 3600000 ms)
const STATUS_REPORT_INTERVAL = 3600000;

// ============================================
// 🔍 SAFETY MONITORING FUNCTIONS
// ============================================

/**
 * Calculate Risk Index (same formula as frontend)
 */
function calculateRiskIndex(ch4, h2s, co, o2) {
    const SAFE_LIMITS = {
        CH4: 5000,
        H2S: 10,
        CO: 35,
        O2_MIN: 19.5,
        O2_MAX: 23.5
    };
    
    // Normalize gas levels to 0-1 scale
    const ch4_norm = Math.min(ch4 / SAFE_LIMITS.CH4, 1.0);
    const h2s_norm = Math.min(h2s / SAFE_LIMITS.H2S, 1.0);
    const co_norm = Math.min(co / SAFE_LIMITS.CO, 1.0);
    
    // O2 deviation from normal range
    const o2_midpoint = (SAFE_LIMITS.O2_MIN + SAFE_LIMITS.O2_MAX) / 2;
    const o2_safe_range = (SAFE_LIMITS.O2_MAX - SAFE_LIMITS.O2_MIN) / 2;
    const o2_deviation = Math.abs(o2 - o2_midpoint) / o2_safe_range;
    
    // Weighted risk calculation
    const riskIndex = (0.3 * ch4_norm) +
                     (0.3 * h2s_norm) +
                     (0.2 * co_norm) +
                     (0.2 * Math.min(o2_deviation, 1.0));
    
    return Math.min(riskIndex * 100, 100);
}

/**
 * Fetch latest sensor data from ThingSpeak and check safety
 */
function performSafetyCheck() {
    const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1`;
    
    https.get(url, (tsRes) => {
        let data = '';
        
        tsRes.on('data', (chunk) => {
            data += chunk;
        });
        
        tsRes.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                
                if (jsonData.feeds && jsonData.feeds.length > 0) {
                    const latestFeed = jsonData.feeds[0];
                    
                    // Extract sensor values
                    const ch4 = parseFloat(latestFeed.field1) || 0;
                    const h2s = parseFloat(latestFeed.field2) || 0;
                    const co = parseFloat(latestFeed.field3) || 0;
                    const o2 = parseFloat(latestFeed.field4) || 21;
                    const temperature = parseFloat(latestFeed.field5) || 25;
                    
                    // Calculate risk index
                    const riskIndex = calculateRiskIndex(ch4, h2s, co, o2);
                    
                    // Prepare sensor data for notification check
                    const sensorData = {
                        ch4,
                        h2s,
                        co,
                        o2,
                        temperature,
                        riskIndex
                    };
                    
                    console.log(`🔍 Safety Check - Risk: ${riskIndex.toFixed(1)}%, H2S: ${h2s.toFixed(2)} PPM, CH4: ${ch4.toFixed(0)} PPM`);
                    
                    // Check if alert should be sent
                    notifications.checkAndAlert(sensorData);
                }
            } catch (error) {
                console.error('❌ Error parsing ThingSpeak data:', error.message);
            }
        });
    }).on('error', (err) => {
        console.error('❌ ThingSpeak fetch error:', err.message);
    });
}

/**
 * Fetch latest sensor data and send status report
 * @param {boolean} forceImmediate - Force immediate send (for startup)
 */
function performStatusReport(forceImmediate = false) {
    const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1`;
    
    https.get(url, (tsRes) => {
        let data = '';
        
        tsRes.on('data', (chunk) => {
            data += chunk;
        });
        
        tsRes.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                
                if (jsonData.feeds && jsonData.feeds.length > 0) {
                    const latestFeed = jsonData.feeds[0];
                    
                    // Extract sensor values
                    const ch4 = parseFloat(latestFeed.field1) || 0;
                    const h2s = parseFloat(latestFeed.field2) || 0;
                    const co = parseFloat(latestFeed.field3) || 0;
                    const o2 = parseFloat(latestFeed.field4) || 21;
                    const temperature = parseFloat(latestFeed.field5) || 25;
                    
                    // Calculate risk index
                    const riskIndex = calculateRiskIndex(ch4, h2s, co, o2);
                    
                    // Prepare sensor data
                    const sensorData = {
                        ch4,
                        h2s,
                        co,
                        o2,
                        temperature,
                        riskIndex
                    };
                    
                    // Send status report
                    notifications.sendStatusReport(sensorData, forceImmediate);
                }
            } catch (error) {
                console.error('❌ Error parsing ThingSpeak data:', error.message);
            }
        });
    }).on('error', (err) => {
        console.error('❌ ThingSpeak fetch error:', err.message);
    });
}

// Start periodic safety monitoring
let safetyCheckTimer = null;
let statusReportTimer = null;

function startSafetyMonitoring() {
    console.log('🛡️ Starting automated safety monitoring...');
    console.log(`   📱 Email notifications: ${notifications.NOTIFICATION_CONFIG.email.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   📊 Status reports: Every ${notifications.NOTIFICATION_CONFIG.statusReportInterval} minutes`);
    
    // Send immediate status report on startup
    console.log('   📧 Sending immediate startup status report...');
    setTimeout(() => performStatusReport(true), 5000);
    
    // Perform initial safety check after 10 seconds
    setTimeout(performSafetyCheck, 10000);
    
    // Then check safety periodically (every 60 seconds)
    safetyCheckTimer = setInterval(performSafetyCheck, SAFETY_CHECK_INTERVAL);
    
    // Send status reports periodically (every 1 hour)
    statusReportTimer = setInterval(() => performStatusReport(false), STATUS_REPORT_INTERVAL);
}

const server = http.createServer((req, res) => {
    // API Proxy endpoint for ThingSpeak
    if (req.url.startsWith('/api/thingspeak')) {
        const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=100`;
        
        console.log('📡 Fetching data from ThingSpeak...');
        
        https.get(url, (tsRes) => {
            let data = '';
            
            tsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            tsRes.on('end', () => {
                console.log('✅ ThingSpeak data received');
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(data);
            });
        }).on('error', (err) => {
            console.error('❌ ThingSpeak Error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch ThingSpeak data' }));
        });
        
        return;
    }
    
    // Default to login.html for root path
    let filePath = req.url === '/' ? '/login.html' : req.url;
    filePath = path.join(PUBLIC_DIR, filePath);

    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    
    // MIME types
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Check if file exists
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🌐 SEWAGE GAS SAFETY DASHBOARD - SERVER RUNNING       ║
║                                                            ║
║     📱 Open your browser and go to:                        ║
║     👉 http://localhost:${PORT}                              ║
║                                                            ║
║     ✅ Server is listening on port ${PORT}                  ║
║     Press Ctrl+C to stop the server                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    
    // Start automated safety monitoring
    startSafetyMonitoring();
});

process.on('SIGINT', () => {
    console.log('\n✋ Stopping server...');
    
    // Stop safety monitoring
    if (safetyCheckTimer) {
        clearInterval(safetyCheckTimer);
        console.log('   🛡️ Safety monitoring stopped');
    }
    
    // Stop status reports
    if (statusReportTimer) {
        clearInterval(statusReportTimer);
        console.log('   📊 Status reports stopped');
    }
    
    console.log('   ✅ Server stopped successfully');
    process.exit(0);
});
