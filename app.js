// ============================================
// Underground Hazardous Gas Monitoring Platform
// app.js - Main Application Logic
// ============================================

// ============================================
// AUTH CHECK
// ============================================
const session = JSON.parse(localStorage.getItem('gasmonitor_session'));
if (!session) { window.location.href = 'login.html'; }

// ============================================
// TUNNEL CONFIGURATIONS
// ============================================
const TUNNEL_CONFIG = {
    sewer: {
        name: 'Sewer / Wastewater Tunnel',
        icon: 'fa-water',
        realtime: true,
        gases: [
            { id: 'h2s', name: 'Hydrogen Sulfide', symbol: 'H₂S', unit: 'PPM', safeLimit: 10, sensor: 'MQ-136', simBase: 8, simRange: 15 },
            { id: 'ch4', name: 'Methane', symbol: 'CH₄', unit: 'PPM', safeLimit: 5000, sensor: 'MQ-4', simBase: 1500, simRange: 2000 },
            { id: 'nh3', name: 'Ammonia', symbol: 'NH₃', unit: 'PPM', safeLimit: 25, sensor: 'MQ-135', simBase: 10, simRange: 20 },
            { id: 'co2', name: 'Carbon Dioxide', symbol: 'CO₂', unit: 'PPM', safeLimit: 5000, sensor: 'MQ-135', simBase: 2000, simRange: 3000 },
            { id: 'o2', name: 'Oxygen', symbol: 'O₂', unit: '%', safeLimit: 19.5, isDeficiency: true, sensor: 'Electrochemical', simBase: 20.5, simRange: 2 },
            { id: 'temperature', name: 'Temperature', symbol: 'Temp', unit: '°C', safeLimit: 40, sensor: 'DHT11', simBase: 26, simRange: 8 },
            { id: 'humidity', name: 'Humidity', symbol: 'Hum', unit: '%', safeLimit: 80, sensor: 'DHT11', simBase: 65, simRange: 20 }
        ],
        predictions: [
            { condition: 'If H₂S reaches 50 PPM', effects: ['Loss of sense of smell', 'Severe lung damage', 'Pulmonary edema risk'] },
            { condition: 'If CH₄ reaches 50,000 PPM (5%)', effects: ['Lower Explosive Limit reached', 'Explosion hazard with any ignition source'] },
            { condition: 'If O₂ drops below 16%', effects: ['Impaired judgement', 'Unconsciousness within minutes', 'Death if prolonged'] },
            { condition: 'If NH₃ reaches 300 PPM', effects: ['Severe chemical burns to eyes/skin', 'Immediate respiratory failure'] },
            { condition: 'If CO₂ reaches 40,000 PPM', effects: ['Immediate headache and dizziness', 'Loss of consciousness', 'Life-threatening'] }
        ]
    },
    mining: {
        name: 'Mining Tunnel',
        icon: 'fa-hard-hat',
        realtime: false,
        gases: [
            { id: 'ch4', name: 'Methane', symbol: 'CH₄', unit: 'PPM', safeLimit: 5000, simBase: 2500, simRange: 3000 },
            { id: 'co', name: 'Carbon Monoxide', symbol: 'CO', unit: 'PPM', safeLimit: 35, simBase: 15, simRange: 25 },
            { id: 'co2', name: 'Carbon Dioxide', symbol: 'CO₂', unit: 'PPM', safeLimit: 5000, simBase: 1800, simRange: 2500 },
            { id: 'h2s', name: 'Hydrogen Sulfide', symbol: 'H₂S', unit: 'PPM', safeLimit: 10, simBase: 4, simRange: 8 },
            { id: 'o2', name: 'Oxygen', symbol: 'O₂', unit: '%', safeLimit: 19.5, isDeficiency: true, simBase: 20, simRange: 3 },
            { id: 'temperature', name: 'Temperature', symbol: 'Temp', unit: '°C', safeLimit: 40, simBase: 30, simRange: 10 },
            { id: 'humidity', name: 'Humidity', symbol: 'Hum', unit: '%', safeLimit: 85, simBase: 70, simRange: 20 },
            { id: 'dust', name: 'Dust Particles', symbol: 'Dust', unit: 'mg/m³', safeLimit: 10, simBase: 5, simRange: 8 }
        ],
        predictions: [
            { condition: 'If CH₄ reaches 50,000 PPM (5%)', effects: ['Firedamp explosion risk', 'Coal dust can amplify blast wave'] },
            { condition: 'If CO reaches 200 PPM', effects: ['Severe headache within 2 hours', 'Life-threatening after 3 hours'] },
            { condition: 'If O₂ drops below 16%', effects: ['Blackdamp conditions', 'Unconsciousness and suffocation'] },
            { condition: 'If dust exceeds 50 mg/m³', effects: ['Silicosis risk', 'Pneumoconiosis (black lung)'] }
        ]
    },
    stormwater: {
        name: 'Stormwater Drainage Tunnel',
        icon: 'fa-cloud-rain',
        realtime: false,
        gases: [
            { id: 'h2s', name: 'Hydrogen Sulfide', symbol: 'H₂S', unit: 'PPM', safeLimit: 10, simBase: 6, simRange: 12 },
            { id: 'ch4', name: 'Methane', symbol: 'CH₄', unit: 'PPM', safeLimit: 5000, simBase: 800, simRange: 1500 },
            { id: 'nh3', name: 'Ammonia', symbol: 'NH₃', unit: 'PPM', safeLimit: 25, simBase: 8, simRange: 15 },
            { id: 'o2', name: 'Oxygen', symbol: 'O₂', unit: '%', safeLimit: 19.5, isDeficiency: true, simBase: 20.5, simRange: 2 },
            { id: 'waterlevel', name: 'Water Level', symbol: 'WL', unit: 'm', safeLimit: 3, simBase: 1.2, simRange: 2 },
            { id: 'temperature', name: 'Temperature', symbol: 'Temp', unit: '°C', safeLimit: 35, simBase: 22, simRange: 8 }
        ],
        predictions: [
            { condition: 'If H₂S reaches 100 PPM', effects: ['Olfactory paralysis', 'Rapid unconsciousness', 'Death within 30-60 min'] },
            { condition: 'If water level rises above 3m', effects: ['Flash flood danger', 'Drowning risk', 'Structural damage'] },
            { condition: 'If CH₄ accumulates above 5%', effects: ['Explosion risk from methane pockets', 'Triggered by static or electrical sparks'] }
        ]
    },
    utility: {
        name: 'Utility Tunnel',
        icon: 'fa-bolt',
        realtime: false,
        gases: [
            { id: 'ch4', name: 'Methane', symbol: 'CH₄', unit: 'PPM', safeLimit: 5000, simBase: 600, simRange: 1200 },
            { id: 'co', name: 'Carbon Monoxide', symbol: 'CO', unit: 'PPM', safeLimit: 35, simBase: 10, simRange: 20 },
            { id: 'co2', name: 'Carbon Dioxide', symbol: 'CO₂', unit: 'PPM', safeLimit: 5000, simBase: 1200, simRange: 2000 },
            { id: 'o2', name: 'Oxygen', symbol: 'O₂', unit: '%', safeLimit: 19.5, isDeficiency: true, simBase: 20.8, simRange: 1.5 },
            { id: 'temperature', name: 'Temperature', symbol: 'Temp', unit: '°C', safeLimit: 45, simBase: 28, simRange: 10 },
            { id: 'smoke', name: 'Smoke Density', symbol: 'Smoke', unit: '%', safeLimit: 20, simBase: 5, simRange: 15 }
        ],
        predictions: [
            { condition: 'If smoke density exceeds 50%', effects: ['Zero visibility', 'Disorientation', 'Cable fire likely in progress'] },
            { condition: 'If CH₄ leaks from gas lines', effects: ['Explosion risk in enclosed space', 'Immediate evacuation required'] },
            { condition: 'If temperature exceeds 60°C', effects: ['Electrical equipment failure', 'Cable insulation melting', 'Fire hazard'] }
        ]
    },
    transportation: {
        name: 'Underground Transportation Tunnel',
        icon: 'fa-subway',
        realtime: false,
        gases: [
            { id: 'co', name: 'Carbon Monoxide', symbol: 'CO', unit: 'PPM', safeLimit: 35, simBase: 18, simRange: 25 },
            { id: 'no2', name: 'Nitrogen Dioxide', symbol: 'NO₂', unit: 'PPM', safeLimit: 3, simBase: 1.2, simRange: 2.5 },
            { id: 'so2', name: 'Sulfur Dioxide', symbol: 'SO₂', unit: 'PPM', safeLimit: 5, simBase: 1.5, simRange: 3 },
            { id: 'co2', name: 'Carbon Dioxide', symbol: 'CO₂', unit: 'PPM', safeLimit: 5000, simBase: 2500, simRange: 2000 },
            { id: 'o2', name: 'Oxygen', symbol: 'O₂', unit: '%', safeLimit: 19.5, isDeficiency: true, simBase: 20.5, simRange: 1.5 },
            { id: 'temperature', name: 'Temperature', symbol: 'Temp', unit: '°C', safeLimit: 40, simBase: 28, simRange: 8 },
            { id: 'airflow', name: 'Airflow', symbol: 'AF', unit: 'm/s', safeLimit: 1, isDeficiency: true, simBase: 3, simRange: 4 }
        ],
        predictions: [
            { condition: 'If CO reaches 400 PPM', effects: ['Life-threatening in 3 hours', 'Headache and nausea in 1 hour'] },
            { condition: 'If NO₂ exceeds 20 PPM', effects: ['Acute bronchospasm', 'Pulmonary edema risk', 'Fatal if prolonged'] },
            { condition: 'If ventilation airflow drops below 0.5 m/s', effects: ['Gas accumulation', 'Oxygen depletion', 'Heat stress'] }
        ]
    },
    construction: {
        name: 'Underground Construction Tunnel',
        icon: 'fa-helmet-safety',
        realtime: false,
        gases: [
            { id: 'co', name: 'Carbon Monoxide', symbol: 'CO', unit: 'PPM', safeLimit: 35, simBase: 20, simRange: 30 },
            { id: 'ch4', name: 'Methane', symbol: 'CH₄', unit: 'PPM', safeLimit: 5000, simBase: 1000, simRange: 2000 },
            { id: 'h2s', name: 'Hydrogen Sulfide', symbol: 'H₂S', unit: 'PPM', safeLimit: 10, simBase: 5, simRange: 10 },
            { id: 'nox', name: 'Nitrogen Oxides', symbol: 'NOx', unit: 'PPM', safeLimit: 5, simBase: 2, simRange: 4 },
            { id: 'o2', name: 'Oxygen', symbol: 'O₂', unit: '%', safeLimit: 19.5, isDeficiency: true, simBase: 20.2, simRange: 2 },
            { id: 'temperature', name: 'Temperature', symbol: 'Temp', unit: '°C', safeLimit: 40, simBase: 27, simRange: 10 },
            { id: 'humidity', name: 'Humidity', symbol: 'Hum', unit: '%', safeLimit: 85, simBase: 60, simRange: 25 },
            { id: 'dust', name: 'Dust Particles', symbol: 'Dust', unit: 'mg/m³', safeLimit: 10, simBase: 6, simRange: 10 }
        ],
        predictions: [
            { condition: 'If CO from diesel equipment exceeds 100 PPM', effects: ['Worker disorientation', 'Cardiac stress', 'CO poisoning'] },
            { condition: 'If NOx from blasting exceeds 25 PPM', effects: ['Severe respiratory distress', 'Chemical pneumonitis'] },
            { condition: 'If dust exceeds 50 mg/m³', effects: ['Silicosis', 'Chronic obstructive pulmonary disease'] },
            { condition: 'If H₂S from ground seepage exceeds 50 PPM', effects: ['Olfactory paralysis', 'Severe lung damage'] }
        ]
    },
    storage: {
        name: 'Ground Storage Caverns',
        icon: 'fa-warehouse',
        realtime: false,
        gases: [
            { id: 'ch4', name: 'Methane', symbol: 'CH₄', unit: 'PPM', safeLimit: 5000, simBase: 3000, simRange: 4000 },
            { id: 'vocs', name: 'Volatile Organic Compounds', symbol: 'VOCs', unit: 'PPM', safeLimit: 300, simBase: 100, simRange: 200 },
            { id: 'co', name: 'Carbon Monoxide', symbol: 'CO', unit: 'PPM', safeLimit: 35, simBase: 8, simRange: 15 },
            { id: 'h2s', name: 'Hydrogen Sulfide', symbol: 'H₂S', unit: 'PPM', safeLimit: 10, simBase: 3, simRange: 7 },
            { id: 'o2', name: 'Oxygen', symbol: 'O₂', unit: '%', safeLimit: 19.5, isDeficiency: true, simBase: 20.5, simRange: 2 },
            { id: 'temperature', name: 'Temperature', symbol: 'Temp', unit: '°C', safeLimit: 35, simBase: 18, simRange: 8 },
            { id: 'pressure', name: 'Pressure', symbol: 'P', unit: 'atm', safeLimit: 1.2, simBase: 1.01, simRange: 0.15 }
        ],
        predictions: [
            { condition: 'If CH₄ exceeds 50,000 PPM in sealed cavern', effects: ['Catastrophic explosion risk', 'Structural collapse'] },
            { condition: 'If VOCs exceed 1000 PPM', effects: ['Narcotic effects', 'Organ damage with prolonged exposure'] },
            { condition: 'If pressure exceeds 1.5 atm', effects: ['Structural integrity compromised', 'Gas blowout risk'] }
        ]
    }
};

// ============================================
// APPLICATION STATE
// ============================================
const appState = {
    currentPage: 'home',
    tunnelData: {},       // current values per tunnel
    historicalData: {},   // arrays per tunnel
    charts: {},
    alerts: [],
    sewerRealtimeData: null,
    refreshTimer: null,
    gasLeakActive: false
};

// Initialize tunnel data
Object.keys(TUNNEL_CONFIG).forEach(tid => {
    appState.tunnelData[tid] = {};
    appState.historicalData[tid] = { timestamps: [] };
    TUNNEL_CONFIG[tid].gases.forEach(g => {
        appState.tunnelData[tid][g.id] = 0;
        appState.historicalData[tid][g.id] = [];
    });
});

// ============================================
// DATA SIMULATION
// ============================================
function generateSimulatedData(tunnelId) {
    const config = TUNNEL_CONFIG[tunnelId];
    config.gases.forEach(gas => {
        const val = gas.simBase + (Math.random() - 0.5) * gas.simRange;
        if (gas.isDeficiency) {
            appState.tunnelData[tunnelId][gas.id] = Math.max(0, val);
        } else {
            appState.tunnelData[tunnelId][gas.id] = Math.max(0, val);
        }
    });
}

function generateAllSimulatedData() {
    Object.keys(TUNNEL_CONFIG).forEach(tid => {
        if (!TUNNEL_CONFIG[tid].realtime) {
            generateSimulatedData(tid);
        }
    });
}

function storeHistoricalPoint(tunnelId) {
    const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hist = appState.historicalData[tunnelId];
    hist.timestamps.push(ts);
    TUNNEL_CONFIG[tunnelId].gases.forEach(g => {
        hist[g.id].push(appState.tunnelData[tunnelId][g.id]);
    });
    // Keep last 50 points
    if (hist.timestamps.length > 50) {
        hist.timestamps.shift();
        TUNNEL_CONFIG[tunnelId].gases.forEach(g => hist[g.id].shift());
    }
}

// ============================================
// THINGSPEAK INTEGRATION (SEWER ONLY)
// ============================================
async function fetchSewerData() {
    try {
        const response = await fetch('/api/thingspeak');
        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        if (data.feeds && data.feeds.length > 0) {
            const latest = data.feeds[data.feeds.length - 1];
            appState.tunnelData.sewer.ch4 = parseFloat(latest.field1) || 0;
            appState.tunnelData.sewer.h2s = parseFloat(latest.field2) || 0;
            // Map CO to nh3 field if not available separately
            const co = parseFloat(latest.field3) || 0;
            appState.tunnelData.sewer.nh3 = co * 0.5; // approximate
            appState.tunnelData.sewer.co2 = parseFloat(latest.field3) ? parseFloat(latest.field3) * 50 : 1500;
            appState.tunnelData.sewer.o2 = parseFloat(latest.field4) || 20.9;
            appState.tunnelData.sewer.temperature = parseFloat(latest.field5) || 25;
            appState.tunnelData.sewer.humidity = 65 + Math.random() * 10;

            // Store historical from all feeds
            appState.historicalData.sewer.timestamps = [];
            TUNNEL_CONFIG.sewer.gases.forEach(g => appState.historicalData.sewer[g.id] = []);
            data.feeds.forEach(feed => {
                const time = new Date(feed.created_at);
                appState.historicalData.sewer.timestamps.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
                appState.historicalData.sewer.h2s.push(parseFloat(feed.field2) || 0);
                appState.historicalData.sewer.ch4.push(parseFloat(feed.field1) || 0);
                appState.historicalData.sewer.nh3.push((parseFloat(feed.field3) || 0) * 0.5);
                appState.historicalData.sewer.co2.push((parseFloat(feed.field3) || 0) * 50 || 1500);
                appState.historicalData.sewer.o2.push(parseFloat(feed.field4) || 20.9);
                appState.historicalData.sewer.temperature.push(parseFloat(feed.field5) || 25);
                appState.historicalData.sewer.humidity.push(65 + Math.random() * 10);
            });

            document.getElementById('systemStatus').className = 'status-indicator';
            document.getElementById('statusText').textContent = 'Connected (Live)';
            return true;
        }
    } catch (e) {
        console.log('ThingSpeak unavailable, using simulated data for sewer');
    }
    // Fallback to simulation
    generateSimulatedData('sewer');
    document.getElementById('systemStatus').className = 'status-indicator offline';
    document.getElementById('statusText').textContent = 'Simulated';
    return false;
}

// ============================================
// RISK CALCULATIONS
// ============================================
function calculateTunnelRisk(tunnelId) {
    const config = TUNNEL_CONFIG[tunnelId];
    const data = appState.tunnelData[tunnelId];
    let totalRisk = 0;
    let gasCount = 0;

    config.gases.forEach(gas => {
        if (gas.id === 'temperature' || gas.id === 'humidity' || gas.id === 'waterlevel' ||
            gas.id === 'airflow' || gas.id === 'pressure') return;
        const val = data[gas.id] || 0;
        let risk;
        if (gas.isDeficiency) {
            // Lower is worse for O2
            risk = val < gas.safeLimit ? ((gas.safeLimit - val) / gas.safeLimit) * 100 : 0;
        } else {
            risk = (val / gas.safeLimit) * 100;
        }
        totalRisk += Math.min(risk, 100);
        gasCount++;
    });

    return gasCount > 0 ? Math.min(totalRisk / gasCount, 100) : 0;
}

function getGasRiskLevel(gas, value) {
    if (gas.isDeficiency) {
        const ratio = value / gas.safeLimit;
        if (ratio > 1.05) return { level: 'safe', label: 'Safe', color: '#00ff88' };
        if (ratio > 0.95) return { level: 'moderate', label: 'Moderate', color: '#ffd700' };
        if (ratio > 0.85) return { level: 'high', label: 'Low Oxygen', color: '#ff6b35' };
        return { level: 'critical', label: 'Critical', color: '#ff3333' };
    }
    const ratio = (value / gas.safeLimit) * 100;
    if (ratio < 30) return { level: 'safe', label: 'Safe', color: '#00ff88' };
    if (ratio < 60) return { level: 'moderate', label: 'Moderate', color: '#ffd700' };
    if (ratio < 80) return { level: 'high', label: 'High', color: '#ff6b35' };
    return { level: 'critical', label: 'Critical', color: '#ff3333' };
}

function getGasEffect(gasId, riskLevel) {
    const effects = {
        h2s: { safe: 'No adverse effects', moderate: 'Eye irritation, breathing difficulty', high: 'Severe respiratory distress', critical: 'Immediate life-threatening' },
        ch4: { safe: 'Normal levels', moderate: 'Accumulation detected', high: 'Explosion risk increasing', critical: 'Explosion hazard - evacuate immediately' },
        nh3: { safe: 'No irritation', moderate: 'Mild nasal irritation', high: 'Severe respiratory burns', critical: 'Life-threatening pulmonary damage' },
        co2: { safe: 'Normal concentration', moderate: 'Headache possible', high: 'Dizziness and confusion', critical: 'Suffocation risk' },
        co: { safe: 'Normal levels', moderate: 'Mild headache after prolonged exposure', high: 'Severe headache, nausea', critical: 'Loss of consciousness, fatal' },
        o2: { safe: 'Normal oxygen levels', moderate: 'Slight shortness of breath', high: 'Impaired judgement, fatigue', critical: 'Suffocation - unconsciousness' },
        no2: { safe: 'Below detection', moderate: 'Mild respiratory irritation', high: 'Bronchospasm risk', critical: 'Pulmonary edema' },
        so2: { safe: 'No effect', moderate: 'Throat irritation', high: 'Severe bronchoconstriction', critical: 'Fatal respiratory failure' },
        nox: { safe: 'Normal', moderate: 'Mild irritation', high: 'Chemical pneumonitis risk', critical: 'Acute lung injury' },
        vocs: { safe: 'Low levels', moderate: 'Headache, eye irritation', high: 'Narcotic effects', critical: 'Organ damage risk' },
        dust: { safe: 'Clean air', moderate: 'Mild respiratory irritation', high: 'Visibility impaired, lung stress', critical: 'Severe respiratory hazard' },
        smoke: { safe: 'Clear', moderate: 'Slight haze', high: 'Reduced visibility', critical: 'Fire in progress - evacuate' },
        temperature: { safe: 'Comfortable', moderate: 'Warm conditions', high: 'Heat stress risk', critical: 'Dangerous heat levels' },
        humidity: { safe: 'Normal', moderate: 'Mildly humid', high: 'High moisture, equipment risk', critical: 'Extreme humidity' },
        waterlevel: { safe: 'Normal water level', moderate: 'Rising water', high: 'Flooding risk', critical: 'Flash flood imminent' },
        airflow: { safe: 'Good ventilation', moderate: 'Reduced airflow', high: 'Poor ventilation', critical: 'Stagnant air - gas accumulation' },
        pressure: { safe: 'Normal atmospheric', moderate: 'Slight pressure change', high: 'Pressure building', critical: 'Dangerous overpressure' }
    };
    return (effects[gasId] && effects[gasId][riskLevel]) || 'Monitoring...';
}

function getRiskStatus(riskIndex) {
    if (riskIndex < 30) return { label: 'SAFE', color: '#00ff88' };
    if (riskIndex < 60) return { label: 'MODERATE', color: '#ffd700' };
    if (riskIndex < 80) return { label: 'HIGH', color: '#ff6b35' };
    return { label: 'CRITICAL', color: '#ff3333' };
}

// ============================================
// ALERT SYSTEM
// ============================================
function checkAlerts() {
    Object.keys(TUNNEL_CONFIG).forEach(tid => {
        const config = TUNNEL_CONFIG[tid];
        const data = appState.tunnelData[tid];
        config.gases.forEach(gas => {
            const val = data[gas.id] || 0;
            const risk = getGasRiskLevel(gas, val);
            if (risk.level === 'critical') {
                addAlert('critical', `${gas.symbol} CRITICAL in ${config.name}`, `${gas.name} at ${val.toFixed(1)} ${gas.unit} - Immediate action required`, tid);
            } else if (risk.level === 'high') {
                addAlert('warning', `${gas.symbol} HIGH in ${config.name}`, `${gas.name} at ${val.toFixed(1)} ${gas.unit} - Monitor closely`, tid);
            }
        });
    });
}

function addAlert(type, title, message, tunnelId) {
    // Avoid duplicate alerts within 60 seconds
    const now = Date.now();
    const duplicate = appState.alerts.find(a => a.title === title && now - a.timestamp < 60000);
    if (duplicate) return;

    appState.alerts.unshift({
        type, title, message, tunnelId,
        timestamp: now,
        time: new Date().toLocaleTimeString()
    });

    // Keep last 100 alerts
    if (appState.alerts.length > 100) appState.alerts.pop();

    // Update badge
    updateAlertBadge();

    // Show popup for critical alerts
    if (type === 'critical') {
        showAlertPopup(title, message);
        triggerGasLeakAnimation();
    }
}

function updateAlertBadge() {
    const badge = document.getElementById('alertBadge');
    const recentCount = appState.alerts.filter(a => Date.now() - a.timestamp < 300000).length;
    if (recentCount > 0) {
        badge.style.display = 'inline';
        badge.textContent = recentCount;
    } else {
        badge.style.display = 'none';
    }
}

function showAlertPopup(title, message) {
    document.getElementById('alertPopupTitle').textContent = title;
    document.getElementById('alertPopupMessage').textContent = message;
    document.getElementById('alertOverlay').style.display = 'flex';
}

function dismissAlert() {
    document.getElementById('alertOverlay').style.display = 'none';
    removeGasLeakAnimation();
}

// ============================================
// GAS LEAK ANIMATION
// ============================================
let gasLeakCanvas, gasLeakCtx, gasParticles = [], gasLeakAnimId;

function triggerGasLeakAnimation() {
    if (appState.gasLeakActive) return;
    appState.gasLeakActive = true;

    if (!gasLeakCanvas) {
        gasLeakCanvas = document.createElement('canvas');
        gasLeakCanvas.className = 'gas-leak-canvas';
        document.body.appendChild(gasLeakCanvas);
        gasLeakCtx = gasLeakCanvas.getContext('2d');
    }

    gasLeakCanvas.width = window.innerWidth;
    gasLeakCanvas.height = window.innerHeight;
    gasLeakCanvas.classList.add('active');

    gasParticles = [];
    for (let i = 0; i < 80; i++) {
        gasParticles.push({
            x: Math.random() * gasLeakCanvas.width,
            y: gasLeakCanvas.height + Math.random() * 100,
            size: Math.random() * 20 + 10,
            speedY: -(Math.random() * 1.5 + 0.5),
            speedX: (Math.random() - 0.5) * 1,
            opacity: Math.random() * 0.15 + 0.05
        });
    }

    function animate() {
        gasLeakCtx.clearRect(0, 0, gasLeakCanvas.width, gasLeakCanvas.height);
        gasParticles.forEach(p => {
            gasLeakCtx.beginPath();
            gasLeakCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            gasLeakCtx.fillStyle = `rgba(255, 80, 80, ${p.opacity})`;
            gasLeakCtx.fill();
            p.y += p.speedY;
            p.x += p.speedX;
            p.opacity -= 0.0003;
            if (p.y < -50 || p.opacity <= 0) {
                p.y = gasLeakCanvas.height + 20;
                p.x = Math.random() * gasLeakCanvas.width;
                p.opacity = Math.random() * 0.15 + 0.05;
            }
        });
        gasLeakAnimId = requestAnimationFrame(animate);
    }
    animate();

    // Add flash bar
    if (!document.getElementById('flashBar')) {
        const bar = document.createElement('div');
        bar.id = 'flashBar';
        bar.className = 'alert-flash-bar';
        document.body.appendChild(bar);
    }
}

function removeGasLeakAnimation() {
    appState.gasLeakActive = false;
    if (gasLeakCanvas) gasLeakCanvas.classList.remove('active');
    if (gasLeakAnimId) cancelAnimationFrame(gasLeakAnimId);
    const bar = document.getElementById('flashBar');
    if (bar) bar.remove();
}

// ============================================
// EXPLOSION RISK MODULE
// ============================================
function showExplosionDetails(tunnelId) {
    const data = appState.tunnelData[tunnelId];
    const ch4 = data.ch4 || 0;
    const ch4Percent = (ch4 / 10000) * 100;

    document.getElementById('explosionModalBody').innerHTML = `
        <h3><i class="fas fa-fire"></i> Methane Explosion Range</h3>
        <p>Methane (CH₄) becomes explosive between <strong>5% – 15%</strong> concentration in air.</p>
        <div style="margin:15px 0; padding:15px; background:rgba(0,0,0,0.2); border-radius:8px;">
            <p style="margin:0;">Current CH₄ Level: <strong style="color:#00d9ff; font-size:20px;">${ch4.toFixed(0)} PPM (${ch4Percent.toFixed(2)}%)</strong></p>
            <p style="margin:8px 0 0;">Status: <span class="status-badge" style="background:${ch4Percent >= 5 ? 'rgba(255,51,51,0.2);color:#ff3333' : ch4Percent >= 2 ? 'rgba(255,215,0,0.2);color:#ffd700' : 'rgba(0,255,136,0.2);color:#00ff88'}">${ch4Percent >= 5 ? '⚠ EXPLOSIVE RANGE' : ch4Percent >= 2 ? '⚡ APPROACHING DANGER' : '✅ BELOW EXPLOSIVE LIMIT'}</span></p>
        </div>
        <div style="width:100%;height:20px;background:linear-gradient(90deg,#00ff88 0%,#ffd700 30%,#ff3333 50%,#ff3333 100%);border-radius:10px;position:relative;margin:10px 0;">
            <div style="position:absolute;left:${Math.min(ch4Percent / 15 * 100, 100)}%;top:-6px;width:4px;height:32px;background:#fff;border-radius:2px;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#888;"><span>0%</span><span>5% LEL</span><span>9.5% Ideal</span><span>15% UEL</span></div>
    `;
    document.getElementById('explosionModal').style.display = 'flex';
}

function showExplosionStatus(tunnelId) {
    const data = appState.tunnelData[tunnelId];
    const ch4 = data.ch4 || 0;
    const o2 = data.o2 || 20.9;
    const temp = data.temperature || 25;
    const ch4Percent = (ch4 / 10000) * 100;
    const prob = Math.min(ch4Percent >= 5 && o2 > 12 ? (ch4Percent * (o2 / 21) * (temp + 273) / 298) * 10 : (ch4Percent / 5) * 30, 100);

    document.getElementById('explosionModalBody').innerHTML = `
        <h3><i class="fas fa-gauge-high"></i> Explosion Probability Meter</h3>
        <div style="text-align:center;margin:20px 0;">
            <svg viewBox="0 0 200 110" width="220">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#333" stroke-width="12" stroke-linecap="round"/>
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" stroke-width="12" stroke-linecap="round"
                    stroke-dasharray="${prob / 100 * 251.2} 251.2"/>
                <defs><linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#00ff88"/><stop offset="50%" style="stop-color:#ffd700"/><stop offset="100%" style="stop-color:#ff3333"/>
                </linearGradient></defs>
                <text x="100" y="90" text-anchor="middle" fill="${prob > 70 ? '#ff3333' : prob > 40 ? '#ffd700' : '#00ff88'}" font-size="28" font-weight="bold">${prob.toFixed(1)}%</text>
                <text x="100" y="108" text-anchor="middle" fill="#888" font-size="10">EXPLOSION PROBABILITY</text>
            </svg>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center;">
            <div style="padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;"><div style="color:#888;font-size:11px;">CH₄</div><div style="color:#00d9ff;font-size:18px;font-weight:700;">${ch4Percent.toFixed(2)}%</div></div>
            <div style="padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;"><div style="color:#888;font-size:11px;">O₂</div><div style="color:#00d9ff;font-size:18px;font-weight:700;">${o2.toFixed(1)}%</div></div>
            <div style="padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;"><div style="color:#888;font-size:11px;">Temp</div><div style="color:#00d9ff;font-size:18px;font-weight:700;">${temp.toFixed(1)}°C</div></div>
        </div>
    `;
    document.getElementById('explosionModal').style.display = 'flex';
}

function showEmergencySteps() {
    document.getElementById('explosionModalBody').innerHTML = `
        <h3><i class="fas fa-exclamation-triangle" style="color:#ff3333;"></i> Emergency Procedures</h3>
        <ol style="padding-left:20px;">
            <li><strong style="color:#ff6b35;">Stop all electrical equipment</strong><br><span style="color:#888;font-size:13px;">Eliminate potential ignition sources immediately</span></li>
            <li><strong style="color:#ff6b35;">Evacuate all workers</strong><br><span style="color:#888;font-size:13px;">Move personnel to designated safe assembly points</span></li>
            <li><strong style="color:#ff6b35;">Ventilate the tunnel</strong><br><span style="color:#888;font-size:13px;">Activate emergency ventilation systems</span></li>
            <li><strong style="color:#ff6b35;">Inform the safety team</strong><br><span style="color:#888;font-size:13px;">Contact emergency coordinator and report conditions</span></li>
            <li><strong style="color:#ff6b35;">Do NOT re-enter</strong><br><span style="color:#888;font-size:13px;">Wait for gas levels to be confirmed safe by monitoring team</span></li>
        </ol>
        <div style="margin-top:15px;padding:12px;background:rgba(255,51,51,0.1);border:1px solid #ff3333;border-radius:8px;text-align:center;">
            <strong style="color:#ff3333;">Emergency Contact: Call Safety Control Room</strong>
        </div>
    `;
    document.getElementById('explosionModal').style.display = 'flex';
}

function closeExplosionModal() {
    document.getElementById('explosionModal').style.display = 'none';
}

// ============================================
// PAGE RENDERERS
// ============================================

function renderHomePage() {
    const tunnelKeys = Object.keys(TUNNEL_CONFIG);
    const iconMap = { sewer: 'fa-water', mining: 'fa-hard-hat', stormwater: 'fa-cloud-rain', utility: 'fa-bolt', transportation: 'fa-subway', construction: 'fa-helmet-safety', storage: 'fa-warehouse' };
    const descMap = {
        sewer: 'Real-time monitoring via ESP8266',
        mining: 'Methane, CO, dust detection',
        stormwater: 'H₂S, flooding, gas levels',
        utility: 'Gas leaks, fire, smoke detection',
        transportation: 'Vehicle emissions, ventilation',
        construction: 'Blasting gases, dust, NOx',
        storage: 'Stored gas leaks, pressure'
    };

    let cardsHtml = tunnelKeys.map(tid => `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
            <div class="area-card" onclick="navigateTo('${tid}/analysis')">
                <div class="area-card-icon"><i class="fas ${TUNNEL_CONFIG[tid].icon}"></i></div>
                <h4>${TUNNEL_CONFIG[tid].name}</h4>
                <p>${descMap[tid]}</p>
                ${TUNNEL_CONFIG[tid].realtime ? '<span style="color:#00ff88;font-size:10px;"><i class="fas fa-circle" style="font-size:6px;"></i> LIVE DATA</span>' : '<span style="color:#ffd700;font-size:10px;"><i class="fas fa-circle" style="font-size:6px;"></i> SIMULATED</span>'}
                <div class="enter-btn">Enter Area →</div>
            </div>
        </div>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
        <div class="container-fluid">
            <div class="home-overview">
                <h2><i class="fas fa-shield-halved"></i> Underground Hazardous Gas Monitoring System</h2>
                <p>This platform predicts and monitors harmful gases in underground environments such as sewer tunnels, mining tunnels, flood drainage tunnels, utility tunnels, underground transportation tunnels, construction tunnels, and ground storage caverns. Real-time sensor data from ESP8266 hardware is combined with AI-driven risk analysis to protect workers and infrastructure.</p>
            </div>
            <h2 class="area-cards-title"><i class="fas fa-map-marker-alt"></i> Areas Monitored</h2>
            <div class="row">${cardsHtml}</div>
        </div>
    `;
    setPageTitle('fa-home', 'Home');
}

function renderAnalysisPage(tunnelId) {
    const config = TUNNEL_CONFIG[tunnelId];
    const data = appState.tunnelData[tunnelId];
    const riskIndex = calculateTunnelRisk(tunnelId);
    const riskStatus = getRiskStatus(riskIndex);

    let gasItemsHtml = config.gases.map(gas => {
        const val = data[gas.id] || 0;
        const risk = getGasRiskLevel(gas, val);
        const effect = getGasEffect(gas.id, risk.level);
        const decimals = val > 100 ? 0 : val > 1 ? 1 : 2;
        return `
            <div class="analysis-gas-item risk-${risk.level}">
                <div class="gas-item-icon"><i class="fas fa-vial"></i></div>
                <div class="gas-item-info">
                    <h4>${gas.name} (${gas.symbol})</h4>
                    <p class="gas-effect">${effect}</p>
                </div>
                <div class="gas-item-value">
                    <div class="value">${val.toFixed(decimals)}</div>
                    <span class="unit">${gas.unit}</span>
                    <div><span class="risk-label ${risk.level}">${risk.label}</span></div>
                </div>
            </div>
        `;
    }).join('');

    // SVG gauge arc
    const gaugeAngle = (riskIndex / 100) * 180;
    const gaugeRad = gaugeAngle * Math.PI / 180;
    const cx = 110, cy = 110, r = 90;
    const endX = cx - r * Math.cos(gaugeRad);
    const endY = cy - r * Math.sin(gaugeRad);
    const largeArc = gaugeAngle > 180 ? 1 : 0;

    let explosionHtml = '';
    if (config.gases.find(g => g.id === 'ch4')) {
        explosionHtml = `
            <div class="explosion-section">
                <h3><i class="fas fa-fire"></i> Explosion Risk Assessment</h3>
                <div class="explosion-buttons">
                    <button class="btn btn-action btn-safe" onclick="showExplosionDetails('${tunnelId}')"><i class="fas fa-eye"></i> View Details</button>
                    <button class="btn btn-action btn-warning" onclick="showExplosionStatus('${tunnelId}')"><i class="fas fa-gauge-high"></i> Current Status</button>
                    <button class="btn btn-action btn-danger" onclick="showEmergencySteps()"><i class="fas fa-exclamation-triangle"></i> Emergency</button>
                </div>
            </div>
        `;
    }

    document.getElementById('pageContent').innerHTML = `
        <div class="container-fluid">
            <h2 class="section-title"><i class="fas fa-microscope"></i> Gas Analysis - ${config.name}</h2>
            ${config.realtime ? '<div style="margin-bottom:15px;"><span style="background:rgba(0,255,136,0.1);color:#00ff88;padding:5px 12px;border-radius:20px;font-size:12px;"><i class="fas fa-satellite-dish"></i> Real-time ESP8266 Data</span></div>' : '<div style="margin-bottom:15px;"><span style="background:rgba(255,215,0,0.1);color:#ffd700;padding:5px 12px;border-radius:20px;font-size:12px;"><i class="fas fa-flask"></i> Simulated Data</span></div>'}
            ${gasItemsHtml}
            <div class="risk-gauge-container">
                <h3>Overall Risk Index</h3>
                <div class="risk-gauge">
                    <svg viewBox="0 0 220 120">
                        <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="#2d3748" stroke-width="14" stroke-linecap="round"/>
                        <path d="M 20 110 A 90 90 0 ${largeArc} 1 ${endX} ${110 - r * Math.sin(gaugeRad)}" fill="none" stroke="url(#riskGaugeGrad)" stroke-width="14" stroke-linecap="round"/>
                        <defs>
                            <linearGradient id="riskGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#00ff88"/>
                                <stop offset="40%" style="stop-color:#ffd700"/>
                                <stop offset="70%" style="stop-color:#ff6b35"/>
                                <stop offset="100%" style="stop-color:#ff3333"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <div class="risk-gauge-value">${riskIndex.toFixed(0)}%</div>
                </div>
                <div class="risk-gauge-status" style="color:${riskStatus.color};">${riskStatus.label}</div>
                <div class="risk-legend" style="margin-top:15px;">
                    <span class="legend-item"><span class="legend-color safe"></span> Safe (0-30%)</span>
                    <span class="legend-item"><span class="legend-color moderate"></span> Moderate (30-60%)</span>
                    <span class="legend-item"><span class="legend-color danger"></span> High (60-80%)</span>
                    <span class="legend-item"><span class="legend-color critical"></span> Critical (80-100%)</span>
                </div>
            </div>
            ${explosionHtml}
        </div>
    `;
    setPageTitle(config.icon, `${config.name} - Analysis`);
}

function renderReportPage(tunnelId) {
    const config = TUNNEL_CONFIG[tunnelId];
    const data = appState.tunnelData[tunnelId];
    const riskIndex = calculateTunnelRisk(tunnelId);
    const riskStatus = getRiskStatus(riskIndex);
    const timestamp = new Date().toLocaleString();

    let sectionsHtml = config.gases.map(gas => {
        const val = data[gas.id] || 0;
        const risk = getGasRiskLevel(gas, val);
        const effect = getGasEffect(gas.id, risk.level);
        const decimals = val > 100 ? 0 : val > 1 ? 1 : 2;
        const cssClass = risk.level === 'critical' ? 'danger' : risk.level === 'high' ? 'warning' : '';
        return `
            <div class="report-section ${cssClass}">
                <h4>${gas.name} (${gas.symbol}) — ${val.toFixed(decimals)} ${gas.unit}</h4>
                <p>Risk Level: <strong>${risk.label}</strong> | Safe Limit: ${gas.safeLimit} ${gas.unit}<br>${effect}</p>
            </div>
        `;
    }).join('');

    let summaryText = '';
    if (riskIndex < 30) {
        summaryText = 'All gas levels are within safe limits. No immediate action is required. Continue routine monitoring.';
    } else if (riskIndex < 60) {
        summaryText = 'Some gas levels are approaching safety thresholds. Increased monitoring and ventilation recommended. Ensure all workers have proper PPE.';
    } else if (riskIndex < 80) {
        summaryText = 'Multiple gas levels exceed safety thresholds. Restrict access and activate enhanced ventilation. Prepare for potential evacuation.';
    } else {
        summaryText = 'CRITICAL CONDITIONS DETECTED. Immediate evacuation recommended. Multiple hazardous gas concentrations are at dangerous levels.';
    }

    document.getElementById('pageContent').innerHTML = `
        <div class="container-fluid">
            <div class="report-container">
                <div class="report-header">
                    <i class="fas fa-file-alt"></i>
                    <h3>Current Gas Report - ${config.name}</h3>
                    <span class="report-timestamp">${timestamp}</span>
                </div>
                <div class="report-section ${riskIndex > 60 ? 'danger' : riskIndex > 30 ? 'warning' : ''}">
                    <h4>Overall Assessment — Risk Index: ${riskIndex.toFixed(1)}% (${riskStatus.label})</h4>
                    <p>${summaryText}</p>
                </div>
                ${sectionsHtml}
                <button class="report-download-btn" onclick="downloadTunnelReport('${tunnelId}')"><i class="fas fa-download"></i> Download Report</button>
            </div>
        </div>
    `;
    setPageTitle(config.icon, `${config.name} - Report`);
}

function renderGraphPage(tunnelId) {
    const config = TUNNEL_CONFIG[tunnelId];

    let chartsHtml = config.gases.map((gas, i) => `
        <div class="col-lg-6">
            <div class="graph-container">
                <h4>${gas.name} (${gas.symbol}) Trend</h4>
                <canvas id="chart_${tunnelId}_${gas.id}"></canvas>
            </div>
        </div>
    `).join('');

    // Add risk index chart and bar comparison chart
    chartsHtml += `
        <div class="col-lg-6">
            <div class="graph-container">
                <h4>Risk Index Trend</h4>
                <canvas id="chart_${tunnelId}_risk"></canvas>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="graph-container">
                <h4>Current Values vs Safe Limits</h4>
                <canvas id="chart_${tunnelId}_bar"></canvas>
            </div>
        </div>
    `;

    document.getElementById('pageContent').innerHTML = `
        <div class="container-fluid graph-page-container">
            <h2 class="section-title"><i class="fas fa-chart-line"></i> Gas Trends - ${config.name}</h2>
            <div class="row g-3">${chartsHtml}</div>
        </div>
    `;
    setPageTitle(config.icon, `${config.name} - Graph`);

    // Initialize charts after DOM is ready
    setTimeout(() => initTunnelCharts(tunnelId), 100);
}

function renderPredictionPage(tunnelId) {
    const config = TUNNEL_CONFIG[tunnelId];

    let cardsHtml = config.predictions.map(pred => `
        <div class="prediction-card">
            <div class="pred-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Prediction Scenario</h4>
            </div>
            <div class="pred-condition">${pred.condition}</div>
            <ul class="pred-effects">
                ${pred.effects.map(e => `<li>${e}</li>`).join('')}
            </ul>
        </div>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
        <div class="container-fluid">
            <h2 class="section-title"><i class="fas fa-brain"></i> Hazard Predictions - ${config.name}</h2>
            <p style="color:#a0a0a0;margin-bottom:20px;">These are <strong>static educational predictions</strong> showing what happens if gas levels increase beyond safety limits.</p>
            ${cardsHtml}
        </div>
    `;
    setPageTitle(config.icon, `${config.name} - Prediction`);
}

function renderAlertsPage() {
    let alertsHtml = appState.alerts.length > 0 ? appState.alerts.map(a => `
        <div class="alert-item alert-${a.type === 'critical' ? 'critical' : a.type === 'warning' ? 'warning' : 'info'}">
            <div class="alert-item-icon"><i class="fas ${a.type === 'critical' ? 'fa-exclamation-triangle' : a.type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i></div>
            <div class="alert-item-content">
                <h4>${a.title}</h4>
                <p>${a.message}</p>
            </div>
            <span class="alert-item-time">${a.time}</span>
        </div>
    `).join('') : '<div style="text-align:center;padding:40px;color:#666;"><i class="fas fa-check-circle" style="font-size:48px;color:#00ff88;display:block;margin-bottom:15px;"></i>No recent alerts. All systems operating normally.</div>';

    document.getElementById('pageContent').innerHTML = `
        <div class="container-fluid">
            <h2 class="section-title"><i class="fas fa-bell"></i> Alert History</h2>
            <div style="margin-bottom:15px;">
                <button class="report-download-btn" onclick="clearAlerts()" style="border-color:#ff3333;color:#ff3333;"><i class="fas fa-trash"></i> Clear All Alerts</button>
            </div>
            ${alertsHtml}
        </div>
    `;
    setPageTitle('fa-bell', 'Alerts');
}

function renderAccountsPage() {
    document.getElementById('pageContent').innerHTML = `
        <div class="container-fluid">
            <h2 class="section-title"><i class="fas fa-user-circle"></i> Account Information</h2>
            <div class="row">
                <div class="col-lg-6 offset-lg-3">
                    <div class="account-card">
                        <div class="account-avatar">${session.name.charAt(0).toUpperCase()}</div>
                        <div class="account-info">
                            <h3>${session.name}</h3>
                            <p>${session.role}</p>
                        </div>
                        <div class="account-details">
                            <div class="account-detail-row"><span class="label">Email</span><span class="value">${session.email}</span></div>
                            <div class="account-detail-row"><span class="label">Role</span><span class="value">${session.role}</span></div>
                            <div class="account-detail-row"><span class="label">Login Time</span><span class="value">${new Date(session.loginTime).toLocaleString()}</span></div>
                            <div class="account-detail-row"><span class="label">Session Status</span><span class="value" style="color:#00ff88;">Active</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    setPageTitle('fa-user-circle', 'Accounts');
}

// ============================================
// CHART.JS INTEGRATION
// ============================================
const chartColors = ['#00d9ff', '#ffd700', '#ff6b35', '#00ff88', '#ff3333', '#9b59b6', '#e74c3c', '#3498db'];

function destroyAllCharts() {
    Object.keys(appState.charts).forEach(key => {
        if (appState.charts[key]) {
            appState.charts[key].destroy();
            delete appState.charts[key];
        }
    });
}

function initTunnelCharts(tunnelId) {
    destroyAllCharts();
    const config = TUNNEL_CONFIG[tunnelId];
    const hist = appState.historicalData[tunnelId];
    const labels = hist.timestamps.slice(-50);

    const chartOpts = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 11 } } } },
        scales: {
            y: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#a0a0a0', maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    };

    // Individual gas charts
    config.gases.forEach((gas, i) => {
        const canvasId = `chart_${tunnelId}_${gas.id}`;
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const dataPoints = (hist[gas.id] || []).slice(-50);
        appState.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${gas.symbol} (${gas.unit})`,
                    data: dataPoints,
                    borderColor: chartColors[i % chartColors.length],
                    backgroundColor: chartColors[i % chartColors.length] + '15',
                    borderWidth: 2, fill: true, tension: 0.4, pointRadius: 2
                }, {
                    label: 'Safe Limit',
                    data: new Array(labels.length).fill(gas.safeLimit),
                    borderColor: '#ff3333',
                    borderDash: [5, 5],
                    borderWidth: 1.5, fill: false, pointRadius: 0
                }]
            },
            options: chartOpts
        });
    });

    // Risk index chart
    const riskCtx = document.getElementById(`chart_${tunnelId}_risk`);
    if (riskCtx) {
        const riskData = labels.map((_, i) => {
            // Calculate risk for each historical point
            let totalRisk = 0, count = 0;
            config.gases.forEach(gas => {
                if (['temperature', 'humidity', 'waterlevel', 'airflow', 'pressure'].includes(gas.id)) return;
                const val = (hist[gas.id] || [])[i] || 0;
                let risk = gas.isDeficiency ? (val < gas.safeLimit ? ((gas.safeLimit - val) / gas.safeLimit) * 100 : 0) : (val / gas.safeLimit) * 100;
                totalRisk += Math.min(risk, 100);
                count++;
            });
            return count > 0 ? Math.min(totalRisk / count, 100) : 0;
        });

        appState.charts[`chart_${tunnelId}_risk`] = new Chart(riskCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Risk Index (%)',
                    data: riskData,
                    borderColor: '#00d9ff',
                    backgroundColor: 'rgba(0,217,255,0.1)',
                    borderWidth: 2, fill: true, tension: 0.4, pointRadius: 2
                }]
            },
            options: chartOpts
        });
    }

    // Bar chart: current vs safe limits
    const barCtx = document.getElementById(`chart_${tunnelId}_bar`);
    if (barCtx) {
        const barGases = config.gases.filter(g => !['temperature', 'humidity', 'waterlevel', 'airflow', 'pressure'].includes(g.id));
        appState.charts[`chart_${tunnelId}_bar`] = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: barGases.map(g => g.symbol),
                datasets: [{
                    label: 'Current Value (normalized %)',
                    data: barGases.map(g => {
                        const val = appState.tunnelData[tunnelId][g.id] || 0;
                        if (g.isDeficiency) return Math.min(((g.safeLimit / Math.max(val, 0.01))) * 100, 150);
                        return Math.min((val / g.safeLimit) * 100, 150);
                    }),
                    backgroundColor: barGases.map((g, i) => chartColors[i % chartColors.length] + '80'),
                    borderColor: barGases.map((g, i) => chartColors[i % chartColors.length]),
                    borderWidth: 1
                }, {
                    label: 'Safe Limit (100%)',
                    data: barGases.map(() => 100),
                    backgroundColor: 'rgba(255,51,51,0.15)',
                    borderColor: '#ff3333',
                    borderWidth: 1, borderDash: [3, 3]
                }]
            },
            options: { ...chartOpts, plugins: { ...chartOpts.plugins, legend: { labels: { color: '#e0e0e0', font: { size: 11 } } } } }
        });
    }
}

// ============================================
// REPORT DOWNLOAD
// ============================================
function downloadTunnelReport(tunnelId) {
    const config = TUNNEL_CONFIG[tunnelId];
    const data = appState.tunnelData[tunnelId];
    const riskIndex = calculateTunnelRisk(tunnelId);
    const riskStatus = getRiskStatus(riskIndex);
    const timestamp = new Date().toLocaleString();

    let report = `UNDERGROUND GAS MONITORING REPORT\n`;
    report += `Location: ${config.name}\n`;
    report += `Generated: ${timestamp}\n`;
    report += `Data Source: ${config.realtime ? 'Real-Time (ESP8266)' : 'Simulated'}\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `OVERALL RISK INDEX: ${riskIndex.toFixed(1)}% - ${riskStatus.label}\n\n`;
    report += `GAS READINGS:\n${'-'.repeat(40)}\n`;

    config.gases.forEach(gas => {
        const val = data[gas.id] || 0;
        const risk = getGasRiskLevel(gas, val);
        const decimals = val > 100 ? 0 : val > 1 ? 1 : 2;
        report += `${gas.name} (${gas.symbol}): ${val.toFixed(decimals)} ${gas.unit} [${risk.label}] (Safe: ${gas.safeLimit} ${gas.unit})\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GasReport_${tunnelId}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// NAVIGATION & ROUTING
// ============================================
function navigateTo(hash) {
    window.location.hash = hash;
}

function setPageTitle(icon, text) {
    document.getElementById('pageTitle').innerHTML = `<i class="fas ${icon}"></i> ${text}`;
}

function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const parts = hash.split('/');
    const page = parts[0];
    const subpage = parts[1];

    destroyAllCharts();

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tunnel-submenu li a').forEach(el => el.classList.remove('active'));

    if (page === 'home') {
        renderHomePage();
        document.querySelector('[data-page="home"]')?.classList.add('active');
    } else if (page === 'accounts') {
        renderAccountsPage();
        document.querySelector('[data-page="accounts"]')?.classList.add('active');
    } else if (page === 'alerts') {
        renderAlertsPage();
        document.querySelector('[data-page="alerts"]')?.classList.add('active');
    } else if (TUNNEL_CONFIG[page] && subpage) {
        // Expand sidebar to show this tunnel
        document.getElementById('placesSubmenu').classList.add('open');
        document.getElementById('placesMenu').classList.add('open');
        const tunnelSub = document.getElementById(`${page}-submenu`);
        if (tunnelSub) {
            tunnelSub.classList.add('open');
            tunnelSub.closest('.submenu-place')?.classList.add('open');
        }
        // Highlight active subpage
        const activeLink = document.querySelector(`a[href="#${hash}"]`);
        if (activeLink) activeLink.classList.add('active');

        if (subpage === 'analysis') renderAnalysisPage(page);
        else if (subpage === 'report') renderReportPage(page);
        else if (subpage === 'graph') renderGraphPage(page);
        else if (subpage === 'prediction') renderPredictionPage(page);
    } else {
        renderHomePage();
    }

    // Scroll to top
    document.getElementById('pageContent').scrollTop = 0;
    window.scrollTo(0, 0);

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 992) {
        closeMobileSidebar();
    }
}

// ============================================
// SIDEBAR CONTROLS
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('expanded');
        // Show/hide overlay
        let overlay = document.getElementById('sidebarOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:299;display:none;';
            overlay.addEventListener('click', function () { closeMobileSidebar(); });
            document.body.appendChild(overlay);
        }
        overlay.style.display = sidebar.classList.contains('expanded') ? 'block' : 'none';
    } else if (window.innerWidth <= 992) {
        sidebar.classList.toggle('expanded');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('expanded');
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.style.display = 'none';
}

function togglePlacesMenu(e) {
    e.preventDefault();
    document.getElementById('placesSubmenu').classList.toggle('open');
    document.getElementById('placesMenu').classList.toggle('open');
}

function toggleTunnelMenu(e, tunnelId) {
    e.preventDefault();
    const sub = document.getElementById(`${tunnelId}-submenu`);
    const place = sub.closest('.submenu-place');
    sub.classList.toggle('open');
    place.classList.toggle('open');
}

function clearAlerts() {
    appState.alerts = [];
    updateAlertBadge();
    renderAlertsPage();
}

function logout() {
    localStorage.removeItem('gasmonitor_session');
    window.location.href = 'login.html';
}

function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('dashboardTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// ============================================
// DATA REFRESH LOOP
// ============================================
async function refreshData() {
    // Fetch sewer real-time data
    await fetchSewerData();

    // Generate simulated data for other tunnels
    generateAllSimulatedData();

    // Store historical points
    Object.keys(TUNNEL_CONFIG).forEach(tid => storeHistoricalPoint(tid));

    // Check for alerts
    checkAlerts();

    // Update timestamp
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();

    // Re-render current page if it's a data page
    const hash = window.location.hash.replace('#', '') || 'home';
    const parts = hash.split('/');
    if (parts[1] === 'analysis') renderAnalysisPage(parts[0]);
    else if (parts[1] === 'report') renderReportPage(parts[0]);
    else if (parts[1] === 'graph' && appState.charts && Object.keys(appState.charts).length > 0) {
        // Update existing charts rather than re-rendering
        const tunnelId = parts[0];
        const config = TUNNEL_CONFIG[tunnelId];
        const hist = appState.historicalData[tunnelId];
        const labels = hist.timestamps.slice(-50);

        config.gases.forEach(gas => {
            const chart = appState.charts[`chart_${tunnelId}_${gas.id}`];
            if (chart) {
                chart.data.labels = labels;
                chart.data.datasets[0].data = (hist[gas.id] || []).slice(-50);
                chart.data.datasets[1].data = new Array(labels.length).fill(gas.safeLimit);
                chart.update('none');
            }
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    // Display user info
    document.getElementById('userDisplay').textContent = session.name + ' (' + session.role + ')';
    document.getElementById('systemStatus').className = 'status-indicator';
    document.getElementById('statusText').textContent = 'Online';

    // Load theme
    const savedTheme = localStorage.getItem('dashboardTheme') || 'dark';
    if (savedTheme === 'light') document.body.classList.add('light-mode');

    // Generate initial data for all tunnels
    generateAllSimulatedData();
    Object.keys(TUNNEL_CONFIG).forEach(tid => {
        // Generate 20 initial historical data points
        for (let i = 0; i < 20; i++) {
            generateSimulatedData(tid);
            storeHistoricalPoint(tid);
        }
    });

    // Fetch sewer data
    fetchSewerData().then(() => {
        handleRoute();
    });

    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);

    // Auto-refresh every 30 seconds
    setInterval(refreshData, 30000);

    // Close sidebar on mobile when clicking main content
    document.getElementById('mainContent').addEventListener('click', function () {
        if (window.innerWidth <= 992) {
            closeMobileSidebar();
        }
    });

    // Add hamburger toggle for mobile
    function createHamburger() {
        let btn = document.getElementById('mobileHamburger');
        if (window.innerWidth <= 768) {
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'mobileHamburger';
                btn.className = 'sidebar-toggle-fixed';
                btn.innerHTML = '<i class="fas fa-bars"></i>';
                btn.addEventListener('click', function () { toggleSidebar(); });
                document.body.appendChild(btn);
            }
            btn.style.display = 'block';
        } else {
            if (btn) btn.style.display = 'none';
        }
    }
    createHamburger();
    window.addEventListener('resize', createHamburger);
});
