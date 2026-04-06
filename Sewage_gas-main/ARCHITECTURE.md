# 🏗️ Complete Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🌍 YOUR SEWAGE TUNNEL MONITORING SYSTEM                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                          HARDWARE LAYER
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   MQ2 Gas Sensor              ESP8266 Microcontroller          │
│   ┌──────────────┐            ┌──────────────────┐             │
│   │  • Analog    │   A0──────>│ • WiFi Module    │             │
│   │  • Detects:  │            │ • Processes Data │             │
│   │    - CH4     │            │ • Sends to Cloud │             │
│   │    - H2S     │            │ • Updates: 30sec │             │
│   │    - CO      │            └──────────────────┘             │
│   │  • Requires  │                    ▲                        │
│   │    5V power  │                    │                        │
│   └──────────────┘                 USB/Serial                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                  ▼
                          CLOUD LAYER
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ThingSpeak Cloud Platform (IoT Data Storage)                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │ Channel: "Sewage Gas Sensor"                     │          │
│  │                                                  │          │
│  │  Field 1: CH4 (Methane)        [Graph]          │          │
│  │  Field 2: H2S (Hydrogen Sulfide) [Graph]        │          │
│  │  Field 3: CO (Carbon Monoxide)   [Graph]        │          │
│  │  Field 4: O2 (Oxygen)            [Graph]        │          │
│  │  Field 5: Temperature            [Graph]        │          │
│  │                                                  │          │
│  │  Stores: Last 3,000,000 data points             │          │
│  │  Free Tier: 15 second minimum updates           │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                  ▼
                          DASHBOARD LAYER
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Your Web Dashboard (http://localhost:8000)                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │  Browser                                         │          │
│  │  ┌────────────────────────────────────────────┐ │          │
│  │  │ Fetches Data from ThingSpeak (every 30s)  │ │          │
│  │  │ Runs Advanced Calculations:                │ │          │
│  │  │  • Risk Index (weighted formula)           │ │          │
│  │  │  • Explosion Probability                   │ │          │
│  │  │  • Safe Exposure Time                      │ │          │
│  │  │  • Trend Analysis                          │ │          │
│  │  │  • Safety Recommendations                  │ │          │
│  │  │                                            │ │          │
│  │  │ Displays:                                  │ │          │
│  │  │  ✓ Real-time gas levels                    │ │          │
│  │  │  ✓ Entry permission status                 │ │          │
│  │  │  ✓ Ventilation recommendations             │ │          │
│  │  │  ✓ Historical charts (last 24 hours)       │ │          │
│  │  │  ✓ Color-coded alerts                      │ │          │
│  │  └────────────────────────────────────────────┘ │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence (Step by Step)

```
TIME: 00:00 seconds
┌──────────────────┐
│ MQ2 Sensor       │
│ Reads gas level  │
│ ADC: 512         │────┐
└──────────────────┘    │
                        ▼
TIME: 00:05 seconds  ┌──────────────────┐
                     │ ESP8266          │
                     │ Converts to PPM  │
                     │ CH4: 2500 PPM    │
                     │ H2S: 25 PPM      │───┐
                     │ CO: 125 PPM      │   │
                     └──────────────────┘   │
                                            ▼
TIME: 00:15 seconds                  ┌──────────────────┐
                                     │ ESP8266 sends    │
                                     │ HTTP Request to  │
                                     │ ThingSpeak API   │
                                     │ (with WiFi)      │───┐
                                     └──────────────────┘   │
                                                            ▼
TIME: 00:16 seconds                             ┌──────────────────┐
                                                │ ThingSpeak       │
                                                │ Stores data in   │
                                                │ database         │
                                                │ Timestamp: 16:45 │───┐
                                                └──────────────────┘   │
                                                                       ▼
TIME: 00:30 seconds (USER OPENS DASHBOARD)          ┌──────────────────┐
                                                    │ Dashboard        │
                                                    │ Browser.js       │
                                                    │ Fetches JSON     │
                                                    │ from ThingSpeak  │───┐
                                                    └──────────────────┘   │
                                                                           ▼
TIME: 00:31 seconds                            ┌────────────────────────────┐
                                               │ JavaScript Calculations:   │
                                               │ • Normalize values         │
                                               │ • Risk = weighted formula  │
                                               │ • Explosion = physics calc │
                                               │ • Exposure = time calc     │
                                               │ • Trends = rate of change  │───┐
                                               └────────────────────────────┘   │
                                                                                 ▼
TIME: 00:32 seconds                      ┌──────────────────────────────────────┐
                                         │ Dashboard UI Updates:                │
                                         │ • Gas cards show PPM values          │
                                         │ • Trend arrows change (↑↓→)          │
                                         │ • Risk bar fills to percentage       │
                                         │ • Color changes based on risk level  │
                                         │ • Charts update with new point       │
                                         │ • Recommendation text changes        │
                                         │ • Entry permission updates           │
                                         │ • Alerts flash if dangerous          │
                                         └──────────────────────────────────────┘
                                                        ▼
                                         🎉 USER SEES REAL-TIME DATA!
```

---

## Configuration Map

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR PROJECT FILES                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SewageGasDashboard/                                   │
│  │                                                      │
│  ├─ index.html                                         │
│  │  └─ Contains 10 UI sections                         │
│  │  └─ Responsive design                              │
│  │  └─ References style.css & script.js               │
│  │                                                     │
│  ├─ style.css                                         │
│  │  └─ Dark theme with cyan accents                   │
│  │  └─ Responsive for mobile/tablet/desktop           │
│  │  └─ Animation effects                              │
│  │  └─ Color-coded status indicators                  │
│  │                                                     │
│  ├─ script.js  ⭐ MOST IMPORTANT                      │
│  │  ├─ Line 8: CONFIG.THINGSPEAK_CHANNEL_ID           │
│  │  │         ↓ Change to: 'YOUR_CHANNEL_ID'         │
│  │  │                                                  │
│  │  ├─ Line 9: CONFIG.THINGSPEAK_READ_API_KEY         │
│  │  │         ↓ Change to: 'YOUR_READ_API_KEY'       │
│  │  │                                                  │
│  │  └─ Contains:                                       │
│  │     • fetchThingSpeakData() - Gets cloud data       │
│  │     • calculateRiskIndex() - Advanced formula       │
│  │     • calculateExplosion() - Physics-based          │
│  │     • updateUI() - Renders dashboard                │
│  │     • Charts.js integration                         │
│  │                                                     │
│  ├─ start-server.ps1                                  │
│  │  └─ PowerShell HTTP server startup script          │
│  │  └─ Serves files on port 8000                      │
│  │                                                     │
│  ├─ THINGSPEAK_SETUP.md  ⭐ READ THIS FIRST          │
│  │  └─ Complete hardware + software setup guide       │
│  │  └─ Arduino code included                          │
│  │  └─ Troubleshooting section                        │
│  │                                                     │
│  └─ QUICK_REFERENCE.md                               │
│     └─ Configuration checklist                        │
│     └─ Testing procedures                             │
│     └─ Common mistakes                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration Checklist with File Locations

```
1. THINGSPEAK SIDE (Web - https://thingspeak.com)
   └─ Create Channel
      ├─ Name: "Sewage Gas Sensor"
      ├─ 5 Fields configured
      ├─ Make Public ✓
      └─ Note down:
         ├─ Channel ID: ________________
         ├─ Write API Key: ________________
         └─ Read API Key: ________________

2. ESP8266 SIDE (Hardware - Arduino IDE)
   └─ Upload this sketch:
      File: THINGSPEAK_SETUP.md (contains full code)
      Edit these lines:
      ├─ Line 5:  ssid = "YOUR_WIFI"
      ├─ Line 6:  password = "YOUR_PASSWORD"
      ├─ Line 9:  writeApiKey = "WRITE_KEY"
      └─ Line 10: channelID = 2456789

3. DASHBOARD SIDE (Web - script.js)
   └─ File: SewageGasDashboard/script.js
      Edit lines 8-10:
      ├─ Line 8: THINGSPEAK_CHANNEL_ID: 'YOUR_ID'
      ├─ Line 9: THINGSPEAK_READ_API_KEY: 'READ_KEY'
      └─ Line 10: REFRESH_INTERVAL: 30000
```

---

## Data Transformation Pipeline

```
Raw ADC Value (0-1023)
        │
        ▼ (Multiply by 5.0/1023)
Voltage (0-5V)
        │
        ├─ → CH4_PPM = voltage × 1000
        ├─ → H2S_PPM = voltage × 10
        └─ → CO_PPM = voltage × 50
        
CH4_PPM, H2S_PPM, CO_PPM + O2% + Temp
        │
        ▼ (Sent to ThingSpeak)
ThingSpeak Storage
        │
        ▼ (Dashboard fetches JSON)
JSON Data: {field1: 2500, field2: 25, ...}
        │
        ├─ → Risk Index Calculation
        │        ├─ Normalize each gas (0-1)
        │        ├─ Apply weights (0.3, 0.3, 0.2, 0.2)
        │        └─ Result: Risk % (0-100%)
        │
        ├─ → Explosion Probability
        │        ├─ CH4 × O2 × Temperature
        │        └─ Result: Explosion % (0-100%)
        │
        ├─ → Exposure Time
        │        ├─ If H2S high: Calculate remaining
        │        └─ Result: Minutes (or ∞)
        │
        ├─ → Trend Analysis
        │        ├─ Compare current vs previous
        │        └─ Result: ↑ ↓ →
        │
        └─ → Safety Recommendation
                 ├─ Check risk + trends
                 └─ Result: Safe/Wait/Evacuate
                 
                 ▼
            🎨 UI RENDERS
        ┌────────────────┐
        │ • Gas cards    │
        │ • Risk bar     │
        │ • Charts       │
        │ • Alerts       │
        │ • Buttons      │
        └────────────────┘
```

---

## Expected Output Example

After proper setup, your dashboard should show:

```
HEADER:
  System Status: ● Connected (Green dot)
  Last Updated: 14:32:45

GAS CARDS:
  CH4: 2500 PPM ↑ (Trend up)
  H2S: 25 PPM ↓ (Trend down)
  CO: 125 PPM → (Stable)
  O2: 21.0 % → (Normal)

RISK ASSESSMENT:
  Risk Index: 45.3% ████████░░
  Classification: Moderate

RECOMMENDATION:
  ⚡ Increase Ventilation
  - Start ventilation fan
  - Wait 5-10 minutes
  - Re-assess conditions

ENTRY STATUS:
  ❌ ENTRY NOT ALLOWED
  Risk level is elevated

CHARTS:
  Last 24 hours of data visible
  Safe limits shown as red dashed lines
  Real data points marked with blue dots
```

---

## Testing Order (IMPORTANT!)

```
1. ESP8266 Test
   ├─ Upload code
   ├─ Open Serial Monitor
   ├─ Check: "WiFi Connected!" message
   └─ ✓ Success if you see IP address

2. ThingSpeak Test
   ├─ Wait 30-60 seconds
   ├─ Go to ThingSpeak channel
   ├─ Click "Private View"
   └─ ✓ Success if graphs show data

3. Dashboard Test
   ├─ Open http://localhost:8000
   ├─ Open Console (F12)
   ├─ Check for "Real Data from ThingSpeak" log
   ├─ Gas values should NOT be random
   └─ ✓ Success if numbers update every 30s
```

---

**Print this diagram for your desk!** 📋

---
