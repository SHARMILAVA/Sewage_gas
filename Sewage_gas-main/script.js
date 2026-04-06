// ============================================
// 🔧 CONFIGURATION
// ============================================
const CONFIG = {
    THINGSPEAK_CHANNEL_ID: '3277165', // Replace with your actual Channel ID
    THINGSPEAK_READ_API_KEY: 'MWUXOBPOKXDK7TI5', // Replace with your Read API Key
    REFRESH_INTERVAL: 30000, // 30 seconds (ThingSpeak free tier limit)
    MAX_DATA_POINTS: 288, // 24 hours of data points
    
    // Safe Limits (PPM/%)
    SAFE_LIMITS: {
        CH4: 5000,      // Methane
        H2S: 10,        // Hydrogen Sulfide
        CO: 35,         // Carbon Monoxide
        O2_MIN: 19.5,   // Oxygen minimum
        O2_MAX: 23.5    // Oxygen maximum
    },
    
    // Exposure Thresholds
    MAX_SAFE_DURATION: 30, // minutes
    CRITICAL_TIME: 2,      // minutes
    
    // Risk Thresholds
    RISK_SAFE: 30,
    RISK_MODERATE: 50,
    RISK_DANGER: 75,
    
    TREND_THRESHOLD: 50
};

// ============================================
// 📊 DATA STORAGE
// ============================================
let dashboardState = {
    currentData: {
        ch4: 0,
        h2s: 0,
        co: 0,
        o2: 21,
        temperature: 25,
        timestamp: new Date()
    },
    previousData: {
        ch4: 0,
        h2s: 0,
        co: 0,
        o2: 21,
        temperature: 25
    },
    historicalData: {
        ch4: [],
        h2s: [],
        co: [],
        o2: [],
        riskIndex: [],
        timestamps: []
    },
    systemStatus: 'offline',
    lastUpdate: new Date(),
    fanStatus: false,
    purgeTimer: 0,
    controlMode: 'auto',
    elapsedTime: 0,
    charts: {},
    startTime: Date.now()
};

// ============================================
// 🌐 THINGSPEAK API INTEGRATION
// ============================================

/**
 * Fetch data from ThingSpeak API
 */
async function fetchThingSpeakData() {
    try {
        // Fetch data from local server proxy (bypasses CORS for private channels)
        const response = await fetch('/api/thingspeak');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('📡 Data received from server');
        
        if (data.feeds && data.feeds.length > 0) {
            const latestFeed = data.feeds[data.feeds.length - 1];
            
            // Store previous data
            dashboardState.previousData = { ...dashboardState.currentData };
            
            // Extract sensor values from ThingSpeak fields
            // Field 1 = CH4, Field 2 = H2S, Field 3 = CO, Field 4 = O2, Field 5 = Temperature
            dashboardState.currentData.ch4 = parseFloat(latestFeed.field1) || 0;
            dashboardState.currentData.h2s = parseFloat(latestFeed.field2) || 0;
            dashboardState.currentData.co = parseFloat(latestFeed.field3) || 0;
            dashboardState.currentData.o2 = parseFloat(latestFeed.field4) || 21;
            dashboardState.currentData.temperature = parseFloat(latestFeed.field5) || 25;
            dashboardState.currentData.timestamp = new Date(latestFeed.created_at);
            
            console.log('✅ Real Data from ThingSpeak:', {
                ch4: dashboardState.currentData.ch4,
                h2s: dashboardState.currentData.h2s,
                co: dashboardState.currentData.co,
                o2: dashboardState.currentData.o2,
                temp: dashboardState.currentData.temperature
            });
            
            // Store historical data
            storeHistoricalData(data.feeds);
            
            dashboardState.systemStatus = 'online';
            return true;
        } else {
            console.warn('⚠️ No data available from ThingSpeak yet');
            dashboardState.systemStatus = 'offline';
            return false;
        }
    } catch (error) {
        console.error('❌ ThingSpeak API Error:', error);
        console.log('💡 Check your server connection');
        dashboardState.systemStatus = 'offline';
        return false;
    }
}

/**
 * Generate mock sensor data for testing/demonstration
 */
function generateMockData() {
    const variation = (base, range) => base + (Math.random() - 0.5) * range;
    
    dashboardState.previousData = { ...dashboardState.currentData };
    
    dashboardState.currentData.ch4 = Math.max(0, variation(2000, 800));
    dashboardState.currentData.h2s = Math.max(0, variation(5, 3));
    dashboardState.currentData.co = Math.max(0, variation(12, 8));
    dashboardState.currentData.o2 = variation(21, 1.5);
    dashboardState.currentData.temperature = variation(25, 5);
    dashboardState.currentData.timestamp = new Date();
    
    if (dashboardState.systemStatus !== 'online') {
        dashboardState.systemStatus = 'online';
    }
}

/**
 * Store historical data for graph visualization
 */
function storeHistoricalData(feeds) {
    dashboardState.historicalData.ch4 = [];
    dashboardState.historicalData.h2s = [];
    dashboardState.historicalData.co = [];
    dashboardState.historicalData.o2 = [];
    dashboardState.historicalData.riskIndex = [];
    dashboardState.historicalData.timestamps = [];
    
    feeds.forEach(feed => {
        const ch4 = parseFloat(feed.field1) || 0;
        const h2s = parseFloat(feed.field2) || 0;
        const co = parseFloat(feed.field3) || 0;
        const o2 = parseFloat(feed.field4) || 21;
        
        dashboardState.historicalData.ch4.push(ch4);
        dashboardState.historicalData.h2s.push(h2s);
        dashboardState.historicalData.co.push(co);
        dashboardState.historicalData.o2.push(o2);
        
        // Calculate risk index for this point
        const risk = calculateRiskIndex(ch4, h2s, co, o2);
        dashboardState.historicalData.riskIndex.push(risk);
        
        // Format timestamp
        const time = new Date(feed.created_at);
        dashboardState.historicalData.timestamps.push(
            time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        );
    });
}

// ============================================
// 🧮 ADVANCED CALCULATIONS & FORMULAS
// ============================================

/**
 * Calculate Risk Index using weighted formula
 * Risk = (0.3 × CH4_norm) + (0.3 × H2S_norm) + (0.2 × CO_norm) + (0.2 × O2_deviation)
 */
function calculateRiskIndex(ch4, h2s, co, o2) {
    // Normalize gas concentrations
    const ch4_norm = Math.min(ch4 / CONFIG.SAFE_LIMITS.CH4, 1.0);
    const h2s_norm = Math.min(h2s / CONFIG.SAFE_LIMITS.H2S, 1.0);
    const co_norm = Math.min(co / CONFIG.SAFE_LIMITS.CO, 1.0);
    
    // O2 deviation from safe range (midpoint 21.5%)
    const o2_midpoint = (CONFIG.SAFE_LIMITS.O2_MIN + CONFIG.SAFE_LIMITS.O2_MAX) / 2;
    const o2_safe_range = (CONFIG.SAFE_LIMITS.O2_MAX - CONFIG.SAFE_LIMITS.O2_MIN) / 2;
    const o2_deviation = Math.abs(o2 - o2_midpoint) / o2_safe_range;
    
    // Weighted risk calculation
    const riskIndex = (0.3 * ch4_norm) +
                     (0.3 * h2s_norm) +
                     (0.2 * co_norm) +
                     (0.2 * Math.min(o2_deviation, 1.0));
    
    return Math.min(riskIndex * 100, 100); // Convert to percentage
}

/**
 * Calculate Explosion Probability using advanced formula
 * explosion_risk = (CH4% × O2% × Temperature_factor) / constant
 */
function calculateExplosionProbability(ch4, o2, temperature) {
    // Explosivity range: CH4 5-15% in air, optimal at 9.5%
    const ch4_percent = (ch4 / 10000) * 100; // Convert PPM to %
    
    // O2 must be present (>12%) for combustion
    if (o2 < 12) return 0;
    
    const o2_percent = Math.min(o2, 25);
    
    // Temperature factor (exponential increase with heat)
    const temperatureK = temperature + 273.15;
    const temperatureFactor = Math.pow(temperatureK / 298, 2) / 10;
    
    // Explosion risk formula
    const explosionRisk = (ch4_percent * (o2_percent / 21) * temperatureFactor) / 0.5;
    
    return Math.min(explosionRisk, 100); // Cap at 100%
}

/**
 * Calculate Safe Exposure Time
 * If H2S > limit: exposure_time = max_safe_duration - elapsed_time
 */
function calculateExposureTime() {
    const elapsedMinutes = Math.floor((Date.now() - dashboardState.startTime) / 60000);
    
    // If H2S exceeds safe limit, calculate remaining time
    if (dashboardState.currentData.h2s > CONFIG.SAFE_LIMITS.H2S) {
        const remainingTime = Math.max(0, CONFIG.MAX_SAFE_DURATION - elapsedMinutes);
        return {
            remaining: remainingTime,
            elapsed: elapsedMinutes,
            isExceeded: remainingTime <= 0
        };
    }
    
    // If safe, return unlimited
    return {
        remaining: Infinity,
        elapsed: elapsedMinutes,
        isExceeded: false
    };
}

/**
 * Calculate Trend Arrow (↑ ↓ →)
 */
function calculateTrend(current, previous, threshold = 5) {
    const change = current - previous;
    
    if (change > threshold) return '↑';      // Rising
    if (change < -threshold) return '↓';     // Falling
    return '→';                               // Stable
}

/**
 * Determine Entry Permission
 * Safe entry if: Risk < 30% AND O2 in normal range AND no critical gas
 */
function determineEntryPermission() {
    const riskIndex = calculateRiskIndex(
        dashboardState.currentData.ch4, 
        dashboardState.currentData.h2s, 
        dashboardState.currentData.co, 
        dashboardState.currentData.o2
    );
    
    const o2_safe = dashboardState.currentData.o2 >= CONFIG.SAFE_LIMITS.O2_MIN && 
                    dashboardState.currentData.o2 <= CONFIG.SAFE_LIMITS.O2_MAX;
    
    const h2s_safe = dashboardState.currentData.h2s <= CONFIG.SAFE_LIMITS.H2S;
    const co_safe = dashboardState.currentData.co <= CONFIG.SAFE_LIMITS.CO;
    
    if (riskIndex < CONFIG.RISK_SAFE && o2_safe && h2s_safe && co_safe) {
        return {
            allowed: true,
            status: 'ENTRY ALLOWED',
            icon: 'fa-check-circle',
            color: 'allowed',
            message: '✅ All conditions safe. Entry authorized.'
        };
    } else if (riskIndex < CONFIG.RISK_MODERATE) {
        return {
            allowed: false,
            status: 'CAUTION - PROCEED CAREFULLY',
            icon: 'fa-exclamation-circle',
            color: 'warning',
            message: '⚠️ Some conditions require attention. Wear full PPE.'
        };
    } else if (riskIndex < CONFIG.RISK_DANGER) {
        return {
            allowed: false,
            status: 'ENTRY NOT ALLOWED',
            icon: 'fa-times-circle',
            color: 'not-allowed',
            message: '❌ Conditions unsafe. Increase ventilation.'
        };
    } else {
        return {
            allowed: false,
            status: 'EMERGENCY - EVACUATE',
            icon: 'fa-exclamation-triangle',
            color: 'not-allowed',
            message: '🚨 CRITICAL CONDITIONS! Immediate evacuation required!'
        };
    }
}

/**
 * Generate Safety Recommendation
 */
function generateSafetyRecommendation() {
    const riskIndex = calculateRiskIndex(
        dashboardState.currentData.ch4, 
        dashboardState.currentData.h2s, 
        dashboardState.currentData.co, 
        dashboardState.currentData.o2
    );
    
    const ch4_trend = calculateTrend(dashboardState.currentData.ch4, dashboardState.previousData.ch4, 100);
    const h2s_trend = calculateTrend(dashboardState.currentData.h2s, dashboardState.previousData.h2s, 0.5);
    
    const hasRisingTrend = ch4_trend === '↑' || h2s_trend === '↑';
    
    if (riskIndex < CONFIG.RISK_SAFE && !hasRisingTrend) {
        return {
            icon: '✅',
            title: 'Safe to Enter',
            description: 'All gas levels are within safe limits.',
            color: 'success',
            actions: ['Proceed with entry', 'Monitor continuously']
        };
    } else if (riskIndex < CONFIG.RISK_MODERATE) {
        return {
            icon: '⚡',
            title: 'Increase Ventilation',
            description: 'Gas levels are rising. Activate ventilation system.',
            color: 'warning',
            actions: ['Start ventilation fan', 'Wait 5-10 minutes', 'Re-assess conditions']
        };
    } else if (riskIndex < CONFIG.RISK_DANGER) {
        return {
            icon: '⏸️',
            title: 'Wait & Ventilate',
            description: 'Unsafe conditions detected. Maintain ventilation.',
            color: 'danger',
            actions: ['Keep fans running', 'Do not enter area', 'Monitor for 15 minutes']
        };
    } else {
        return {
            icon: '🚨',
            title: 'Emergency Evacuation',
            description: 'CRITICAL CONDITIONS! Evacuate immediately!',
            color: 'danger',
            actions: ['Evacuate personnel', 'Contact emergency services', 'Activate safety protocols']
        };
    }
}

/**
 * Predictive Alert - Estimate when danger level will be reached
 */
function generatePredictiveAlert() {
    const ch4_trend = dashboardState.currentData.ch4 - dashboardState.previousData.ch4;
    const h2s_trend = dashboardState.currentData.h2s - dashboardState.previousData.h2s;
    
    // If gas rising significantly
    if (ch4_trend > 100 || h2s_trend > 0.5) {
        // Linear extrapolation
        const ch4_timeToLimit = (CONFIG.SAFE_LIMITS.CH4 - dashboardState.currentData.ch4) / (ch4_trend || 1);
        const h2s_timeToLimit = (CONFIG.SAFE_LIMITS.H2S - dashboardState.currentData.h2s) / (h2s_trend || 0.01);
        
        const estimatedMinutes = Math.min(
            Math.max(0, (ch4_timeToLimit * 5) / 60),
            Math.max(0, (h2s_timeToLimit * 5) / 60)
        );
        
        if (estimatedMinutes < 30 && estimatedMinutes > 0) {
            return {
                active: true,
                message: `⚠️ Danger level expected in approximately ${Math.round(estimatedMinutes)} minutes`,
                timeRemaining: Math.round(estimatedMinutes)
            };
        }
    }
    
    return { active: false };
}

// ============================================
// 🎨 UI UPDATE FUNCTIONS
// ============================================

/**
 * Update all UI elements with current data
 */
function updateUI() {
    updateHeader();
    updateGasCards();
    updateRiskIndex();
    updateExposureTime();
    updateExplosionProbability();
    updateEntryPermission();
    updateSafetyRecommendation();
    updatePredictiveAlert();
    updateVentilationStatus();
    updateCharts();
}

/**
 * Update header (status, timestamp)
 */
function updateHeader() {
    const statusElement = document.getElementById('systemStatus');
    const statusText = document.getElementById('statusText');
    const lastUpdated = document.getElementById('lastUpdated');
    
    if (statusElement && statusText && lastUpdated) {
        statusElement.className = `status-indicator ${dashboardState.systemStatus}`;
        statusText.textContent = dashboardState.systemStatus === 'online' ? 'Connected' : 'Disconnected';
        lastUpdated.textContent = dashboardState.currentData.timestamp.toLocaleTimeString();
    }
}

/**
 * Update gas level cards
 */
function updateGasCards() {
    const gases = [
        { id: 'ch4', value: dashboardState.currentData.ch4, limit: CONFIG.SAFE_LIMITS.CH4, previous: dashboardState.previousData.ch4, decimals: 0 },
        { id: 'h2s', value: dashboardState.currentData.h2s, limit: CONFIG.SAFE_LIMITS.H2S, previous: dashboardState.previousData.h2s, decimals: 2 },
        { id: 'co', value: dashboardState.currentData.co, limit: CONFIG.SAFE_LIMITS.CO, previous: dashboardState.previousData.co, decimals: 1 },
        { id: 'o2', value: dashboardState.currentData.o2, limit: 21, previous: dashboardState.previousData.o2, decimals: 1 }
    ];
    
    gases.forEach(gas => {
        const valueElement = document.getElementById(`${gas.id}Value`);
        const trendElement = document.getElementById(`${gas.id}Trend`);
        const fillElement = document.getElementById(`${gas.id}Fill`);
        const cardElement = document.getElementById(`${gas.id}Card`);
        
        if (!valueElement) return; // Skip if element doesn't exist
        
        // Update value
        valueElement.textContent = gas.value.toFixed(gas.decimals);
        
        // Update trend arrow
        const trend = calculateTrend(gas.value, gas.previous);
        if (trendElement) {
            trendElement.textContent = trend;
            trendElement.className = 'trend-arrow';
            if (trend === '↑') trendElement.classList.add('up');
            else if (trend === '↓') trendElement.classList.add('down');
        }
        
        // Update status bar fill and color
        let fillPercent = (gas.value / gas.limit) * 100;
        if (gas.id === 'o2') {
            fillPercent = Math.abs(gas.value - 21) * 10;
        }
        fillPercent = Math.min(fillPercent, 100);
        
        if (fillElement) {
            fillElement.style.width = fillPercent + '%';
            
            // Determine color
            let color = '#00ff88'; // Green (safe)
            if (fillPercent > 75) color = '#ff3333'; // Red (critical)
            else if (fillPercent > 50) color = '#ff6b35'; // Orange (danger)
            else if (fillPercent > 30) color = '#ffd700'; // Yellow (warning)
            
            fillElement.style.backgroundColor = color;
        }
        
        // Update card border color
        if (cardElement) {
            cardElement.style.borderLeftColor = fillElement.style.backgroundColor;
        }
    });
}

/**
 * Update risk index panel
 */
function updateRiskIndex() {
    const riskIndex = calculateRiskIndex(
        dashboardState.currentData.ch4, 
        dashboardState.currentData.h2s, 
        dashboardState.currentData.co, 
        dashboardState.currentData.o2
    );
    
    const riskValue = document.getElementById('riskValue');
    const riskBar = document.getElementById('riskBar');
    const riskClassification = document.getElementById('riskClassification');
    
    if (riskValue) riskValue.textContent = riskIndex.toFixed(1) + '%';
    
    if (riskBar) {
        riskBar.style.width = riskIndex + '%';
        
        // Color code based on risk level
        let barColor = '#00ff88'; // Green
        let classification = 'Safe';
        
        if (riskIndex >= CONFIG.RISK_DANGER) {
            barColor = '#ff3333'; // Red
            classification = 'Critical';
        } else if (riskIndex >= CONFIG.RISK_MODERATE) {
            barColor = '#ff6b35'; // Orange
            classification = 'Danger';
        } else if (riskIndex >= CONFIG.RISK_SAFE) {
            barColor = '#ffd700'; // Yellow
            classification = 'Moderate';
        }
        
        riskBar.style.backgroundColor = barColor;
        if (riskClassification) riskClassification.textContent = classification;
    }
}

/**
 * Update exposure time
 */
function updateExposureTime() {
    const exposure = calculateExposureTime();
    const exposureElement = document.getElementById('exposureTime');
    const exposureAlert = document.getElementById('exposureAlert');
    const elapsedElement = document.getElementById('elapsedTime');
    
    if (exposureElement) {
        if (exposure.remaining === Infinity) {
            exposureElement.textContent = '∞';
            exposureElement.classList.remove('flashing');
        } else {
            exposureElement.textContent = Math.max(0, exposure.remaining);
            
            if (exposure.remaining <= CONFIG.CRITICAL_TIME) {
                if (exposureAlert) exposureAlert.style.display = 'block';
                exposureElement.classList.add('flashing');
            } else {
                if (exposureAlert) exposureAlert.style.display = 'none';
                exposureElement.classList.remove('flashing');
            }
        }
    }
    
    if (elapsedElement) {
        elapsedElement.textContent = exposure.elapsed;
    }
}

/**
 * Update explosion probability
 */
function updateExplosionProbability() {
    const explosionRisk = calculateExplosionProbability(
        dashboardState.currentData.ch4, 
        dashboardState.currentData.o2, 
        dashboardState.currentData.temperature
    );
    
    const explosionValue = document.getElementById('explosionValue');
    const explosionArc = document.getElementById('explosionArc');
    const explosionAlert = document.getElementById('explosionAlert');
    
    if (explosionValue) explosionValue.textContent = explosionRisk.toFixed(1) + '%';
    
    if (explosionArc) {
        const arcLength = (explosionRisk / 100) * 314;
        explosionArc.setAttribute('stroke-dasharray', `${arcLength} 314`);
        
        // Update color
        if (explosionRisk > 70) {
            explosionArc.style.stroke = '#ff3333';
        } else if (explosionRisk > 50) {
            explosionArc.style.stroke = '#ff6b35';
        } else if (explosionRisk > 30) {
            explosionArc.style.stroke = '#ffd700';
        } else {
            explosionArc.style.stroke = '#00ff88';
        }
    }
    
    if (explosionAlert) {
        explosionAlert.style.display = explosionRisk > 70 ? 'block' : 'none';
    }
}

/**
 * Update entry permission display
 */
function updateEntryPermission() {
    const permission = determineEntryPermission();
    const box = document.getElementById('entryPermissionBox');
    const icon = document.getElementById('entryIcon');
    const status = document.getElementById('entryStatus');
    const message = document.getElementById('entryMessage');
    
    if (!box) return;
    
    box.className = `entry-permission-box ${permission.color}`;
    if (icon) icon.innerHTML = `<i class="fas ${permission.icon}"></i>`;
    if (status) status.textContent = permission.status;
    if (message) message.textContent = permission.message;
}

/**
 * Update safety recommendation
 */
function updateSafetyRecommendation() {
    const recommendation = generateSafetyRecommendation();
    const box = document.getElementById('recommendationBox');
    
    if (!box) return;
    
    let html = `
        <div class="recommendation-status ${recommendation.color}">
            <div style="font-size: 2em; margin-bottom: 10px;">${recommendation.icon}</div>
            <h4>${recommendation.title}</h4>
            <p>${recommendation.description}</p>
            <ul>
    `;
    
    recommendation.actions.forEach(action => {
        html += `<li>${action}</li>`;
    });
    
    html += `</ul></div>`;
    
    box.innerHTML = html;
}

/**
 * Update predictive alert
 */
function updatePredictiveAlert() {
    const alert = generatePredictiveAlert();
    const alertBanner = document.getElementById('predictiveAlert');
    const alertText = document.getElementById('predictiveAlertText');
    
    if (!alertBanner) return;
    
    if (alert.active) {
        alertBanner.style.display = 'flex';
        if (alertText) alertText.textContent = alert.message;
    } else {
        alertBanner.style.display = 'none';
    }
}

/**
 * Update ventilation status
 */
function updateVentilationStatus() {
    const fanIndicator = document.getElementById('fanIndicator');
    const fanText = document.getElementById('fanText');
    const controlModeElement = document.getElementById('controlMode');
    
    if (!fanIndicator) return;
    
    // Auto-control logic
    const riskIndex = calculateRiskIndex(
        dashboardState.currentData.ch4, 
        dashboardState.currentData.h2s, 
        dashboardState.currentData.co, 
        dashboardState.currentData.o2
    );
    
    if (dashboardState.controlMode === 'auto') {
        if (riskIndex > CONFIG.RISK_SAFE) {
            dashboardState.fanStatus = true;
        }
    }
    
    fanIndicator.className = `fan-indicator ${dashboardState.fanStatus ? 'on' : ''}`;
    if (fanText) fanText.textContent = dashboardState.fanStatus ? 'ON' : 'OFF';
    
    if (controlModeElement) {
        if (dashboardState.controlMode === 'auto') {
            controlModeElement.innerHTML = '<span class="badge-auto">AUTO</span>';
        } else {
            controlModeElement.innerHTML = '<span class="badge-manual">MANUAL</span>';
        }
    }
}

// ============================================
// 📊 CHART.JS VISUALIZATION
// ============================================

/**
 * Initialize and update all charts
 */
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#e0e0e0',
                    font: { size: 12 }
                }
            }
        },
        scales: {
            y: {
                ticks: { color: '#a0a0a0' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
                ticks: { color: '#a0a0a0' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
        }
    };
    
    // CH4 Chart
    const ch4Ctx = document.getElementById('ch4Chart');
    if (ch4Ctx) {
        dashboardState.charts.ch4 = new Chart(ch4Ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CH₄ (PPM)',
                    data: [],
                    borderColor: '#00d9ff',
                    backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#00d9ff'
                }, {
                    label: 'Safe Limit',
                    data: [],
                    borderColor: '#ff3333',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: chartOptions
        });
    }
    
    // H2S Chart
    const h2sCtx = document.getElementById('h2sChart');
    if (h2sCtx) {
        dashboardState.charts.h2s = new Chart(h2sCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'H₂S (PPM)',
                    data: [],
                    borderColor: '#ffd700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#ffd700'
                }, {
                    label: 'Safe Limit',
                    data: [],
                    borderColor: '#ff3333',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: chartOptions
        });
    }
    
    // CO Chart
    const coCtx = document.getElementById('coChart');
    if (coCtx) {
        dashboardState.charts.co = new Chart(coCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CO (PPM)',
                    data: [],
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#ff6b35'
                }, {
                    label: 'Safe Limit',
                    data: [],
                    borderColor: '#ff3333',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: chartOptions
        });
    }
    
    // Risk Index Chart
    const riskCtx = document.getElementById('riskChart');
    if (riskCtx) {
        dashboardState.charts.risk = new Chart(riskCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Risk Index (%)',
                    data: [],
                    borderColor: '#00d9ff',
                    backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#00d9ff'
                }]
            },
            options: chartOptions
        });
    }
}

/**
 * Update chart data
 */
function updateCharts() {
    const maxDataPoints = 50;
    
    const labels = dashboardState.historicalData.timestamps
        .slice(-maxDataPoints)
        .map(ts => ts);
    
    if (dashboardState.charts.ch4) {
        dashboardState.charts.ch4.data.labels = labels;
        dashboardState.charts.ch4.data.datasets[0].data = dashboardState.historicalData.ch4.slice(-maxDataPoints);
        dashboardState.charts.ch4.data.datasets[1].data = new Array(labels.length).fill(CONFIG.SAFE_LIMITS.CH4);
        dashboardState.charts.ch4.update('none');
    }
    
    if (dashboardState.charts.h2s) {
        dashboardState.charts.h2s.data.labels = labels;
        dashboardState.charts.h2s.data.datasets[0].data = dashboardState.historicalData.h2s.slice(-maxDataPoints);
        dashboardState.charts.h2s.data.datasets[1].data = new Array(labels.length).fill(CONFIG.SAFE_LIMITS.H2S);
        dashboardState.charts.h2s.update('none');
    }
    
    if (dashboardState.charts.co) {
        dashboardState.charts.co.data.labels = labels;
        dashboardState.charts.co.data.datasets[0].data = dashboardState.historicalData.co.slice(-maxDataPoints);
        dashboardState.charts.co.data.datasets[1].data = new Array(labels.length).fill(CONFIG.SAFE_LIMITS.CO);
        dashboardState.charts.co.update('none');
    }
    
    if (dashboardState.charts.risk) {
        dashboardState.charts.risk.data.labels = labels;
        dashboardState.charts.risk.data.datasets[0].data = dashboardState.historicalData.riskIndex.slice(-maxDataPoints);
        dashboardState.charts.risk.update('none');
    }
}

// ============================================
// 🎮 USER INTERACTION FUNCTIONS
// ============================================

/**
 * Toggle ventilation fan
 */
function toggleFan() {
    dashboardState.fanStatus = !dashboardState.fanStatus;
    dashboardState.controlMode = 'manual';
    updateVentilationStatus();
}

/**
 * Reset purge timer
 */
function resetPurge() {
    dashboardState.startTime = Date.now();
    alert('Purge timer has been reset.');
}

/**
 * Toggle control mode (Auto/Manual)
 */
function toggleControlMode() {
    dashboardState.controlMode = dashboardState.controlMode === 'auto' ? 'manual' : 'auto';
    updateVentilationStatus();
}

/**
 * Download PDF report
 */
function downloadReport() {
    const timestamp = new Date().toLocaleString('en-US');
    const reportContent = `
    SEWAGE TUNNEL GAS SAFETY DASHBOARD REPORT
    Generated: ${timestamp}
    
    ===== CURRENT GAS LEVELS =====
    Methane (CH₄): ${dashboardState.currentData.ch4.toFixed(0)} PPM (Safe Limit: ${CONFIG.SAFE_LIMITS.CH4} PPM)
    Hydrogen Sulfide (H₂S): ${dashboardState.currentData.h2s.toFixed(2)} PPM (Safe Limit: ${CONFIG.SAFE_LIMITS.H2S} PPM)
    Carbon Monoxide (CO): ${dashboardState.currentData.co.toFixed(1)} PPM (Safe Limit: ${CONFIG.SAFE_LIMITS.CO} PPM)
    Oxygen (O₂): ${dashboardState.currentData.o2.toFixed(1)}% (Safe Range: ${CONFIG.SAFE_LIMITS.O2_MIN}-${CONFIG.SAFE_LIMITS.O2_MAX}%)
    Temperature: ${dashboardState.currentData.temperature.toFixed(1)}°C
    
    ===== RISK ASSESSMENT =====
    Risk Index: ${calculateRiskIndex(dashboardState.currentData.ch4, dashboardState.currentData.h2s, dashboardState.currentData.co, dashboardState.currentData.o2).toFixed(1)}%
    Explosion Probability: ${calculateExplosionProbability(dashboardState.currentData.ch4, dashboardState.currentData.o2, dashboardState.currentData.temperature).toFixed(1)}%
    Safe Exposure Time: ${calculateExposureTime().remaining === Infinity ? '∞' : Math.round(calculateExposureTime().remaining) + ' minutes'}
    
    ===== SAFETY STATUS =====
    Entry Permission: ${determineEntryPermission().status}
    Ventilation Fan: ${dashboardState.fanStatus ? 'ON' : 'OFF'}
    Control Mode: ${dashboardState.controlMode.toUpperCase()}
    System Status: ${dashboardState.systemStatus.toUpperCase()}
    `;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `SewageGas_Report_${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    alert('Report downloaded successfully!');
}

/**
 * Toggle dark/light mode
 */
function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('dashboardTheme', theme);
}

// ============================================
// 🔄 INITIALIZATION & AUTO-REFRESH
// ============================================

/**
 * Main initialization function
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard initializing...');
    console.log('📡 ThingSpeak Channel ID:', CONFIG.THINGSPEAK_CHANNEL_ID);
    console.log('🔑 API Key:', CONFIG.THINGSPEAK_READ_API_KEY ? '✓ Set' : '❌ Not set');
    
    // Load theme preference
    const savedTheme = localStorage.getItem('dashboardTheme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    
    // Initialize charts
    initializeCharts();
    
    // Fetch initial data (real or mock)
    fetchThingSpeakData().then(success => {
        if (!success) {
            console.log('📊 Using mock data for demonstration');
            generateMockData();
            const feeds = [];
            for (let i = 0; i < 10; i++) {
                feeds.push({
                    created_at: new Date(Date.now() - i * 30000).toISOString(),
                    field1: Math.max(0, 2000 + Math.random() * 500),
                    field2: Math.max(0, 5 + Math.random() * 3),
                    field3: Math.max(0, 12 + Math.random() * 8),
                    field4: 21 + Math.random() * 1.5,
                    field5: 25 + Math.random() * 5
                });
            }
            storeHistoricalData(feeds);
        }
        
        // Update UI
        updateUI();
        
        // Set up auto-refresh
        setInterval(async () => {
            dashboardState.previousData = { ...dashboardState.currentData };
            
            const success = await fetchThingSpeakData();
            if (!success) {
                generateMockData();
            }
            
            updateUI();
        }, CONFIG.REFRESH_INTERVAL);
        
        console.log(`✅ Dashboard initialized - Refreshing every ${CONFIG.REFRESH_INTERVAL / 1000} seconds`);
    });
});