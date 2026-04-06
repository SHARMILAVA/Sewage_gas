# 🌐 Sewage Tunnel Gas Safety Dashboard

Real-time Intelligent Safety Dashboard for IoT Sewage Tunnel Gas Monitoring

## 📋 Overview

This project is a comprehensive web-based dashboard that monitors gas levels in sewage tunnels and provides real-time safety alerts, risk assessments, and entry permission decisions.

## 🎯 Features

✅ **Real-Time Gas Monitoring**
- Methane (CH₄) - PPM tracking
- Hydrogen Sulfide (H₂S) - PPM tracking
- Carbon Monoxide (CO) - PPM tracking
- Oxygen (O₂) - Percentage tracking

✅ **Intelligent Safety Calculations**
- Risk Index calculation (weighted formula)
- Explosion Probability assessment
- Safe exposure time calculation
- Trend arrow indicators

✅ **Decision Support**
- Automatic entry permission system
- Safety recommendations
- Predictive alerts for rising gases
- Ventilation system control

✅ **Historical Data & Analytics**
- Line graphs for each gas parameter
- Risk Index trend visualization
- Last 24-hour data retention
- Time-series analysis

✅ **Industrial Design**
- Dark theme with high contrast
- Real-time system status indicator
- Color-coded alerts (Green/Yellow/Orange/Red)
- Responsive design (Desktop/Tablet/Mobile)

✅ **Additional Features**
- Dark/Light mode toggle
- PDF report download
- Automatic purge timer
- Fan control (Auto/Manual)
- Last updated timestamp

## 📁 Project Structure

```
SewageGasDashboard/
│
├── index.html          # Main HTML structure (10 sections)
├── style.css           # Industrial dark theme styling
├── script.js           # All logic, calculations & API integration
├── assets/             # Future assets folder
└── README.md          # This file
```

## 🛠 Technology Stack

- **HTML5** - Semantic structure
- **CSS3** - Responsive grid layout, animations
- **JavaScript (Vanilla)** - No jQuery dependency
- **Chart.js** - Historical data visualization
- **Bootstrap 5** - Optional responsive framework
- **Font Awesome 6** - Icons
- **ThingSpeak API** - IoT data integration

## 🚀 Quick Start

### 1. Open the Dashboard
Simply open `index.html` in a web browser:
- Double-click the file, or
- Right-click → Open with → Your Browser

### 1A. Two-Board Hardware Setup
If you are using Arduino Uno + ESP8266, use the split firmware:
- Upload [ESP8266_SewageGasSensor.ino](ESP8266_SewageGasSensor.ino) to the Arduino Uno sensor node.
- Upload [ESP8266_ThingSpeak_Gateway.ino](ESP8266_ThingSpeak_Gateway.ino) to the ESP8266 WiFi gateway.
- Connect Uno D3 (TX from SoftwareSerial) to ESP8266 D6 (RX) through a 5V-to-3.3V level shifter or resistor divider.
- Connect Uno GND and ESP8266 GND together.
- The Uno sends CSV packets in this format: `MQ2,MQ3,MQ4,WarningScore`.
- The ESP8266 reads those packets and uploads them to ThingSpeak fields 1, 2, 3, and 5.

### 2. Configure ThingSpeak API
Edit `script.js` and update the configuration:
```javascript
const CONFIG = {
    CHANNEL_ID: 'YOUR_CHANNEL_ID',     // Replace with your ThingSpeak Channel ID
    API_KEY: 'YOUR_API_KEY',            // Replace with your API Key
    // ... rest of configuration
};
```

### 3. Data Fields Mapping
Update the API endpoint to map your ThingSpeak fields:
- **field1** → MQ-4 / Methane (CH₄)
- **field2** → MQ-2 / Toxic sewer gas index
- **field3** → MQ-3 / Flammable VOC vapor
- **field5** → Warning score

### 4. Using Mock Data
The dashboard comes with built-in mock data generator for testing:
```javascript
// In script.js, the fetchAndUpdateData() function uses mock data by default
// Comment out the mock data section and uncomment the actual API call when ready
```

## 📊 Dashboard Sections

### 1️⃣ HEADER
- Project title with icon
- System status indicator (Green/Red dot)
- Last updated timestamp
- Real-time clock display

### 2️⃣ GAS PPM CARDS (4 Cards)
- Current PPM values
- Safe limits
- Status color coding
- Trend arrows (↑ ↓ →)
- Visual progress bars

### 3️⃣ RISK INDEX PANEL
- Risk percentage (0-100%)
- Color-coded progress bar
- Risk classification (Safe/Moderate/Danger/Critical)
- Risk legend

### 4️⃣ EXPOSURE TIME
- Safe exposure time countdown
- Flashing alert if < 2 minutes
- Elapsed time tracker
- Maximum duration reference

### 5️⃣ EXPLOSION PROBABILITY
- Circular gauge visualization
- Percentage display
- Color indicators
- Warning if > 70%

### 6️⃣ SAFETY RECOMMENDATION
- Automatic recommendation engine
- 4 possible outputs:
  - ✅ Safe to Enter
  - ⏳ Wait & Ventilate
  - ⚠️ Increase Ventilation
  - 🚨 Emergency Evacuation
- Action buttons

### 7️⃣ ENTRY PERMISSION
- Large, clear authorization status
- Green (Allowed) / Red (Not Allowed)
- Supporting reason messages
- Animated status icons

### 8️⃣ VENTILATION STATUS
- Fan ON/OFF indicator with animation
- Purge timer (countdown)
- Auto/Manual control toggle
- System management buttons

### 9️⃣ PREDICTIVE ALERTS
- Banner alert for rising gas levels
- Estimated time to danger level
- Flashing warning animation
- Appears only when necessary

### 🔟 HISTORICAL GRAPHS
- CH₄ trend graph (Line chart)
- H₂S trend graph (Line chart)
- CO trend graph (Line chart)
- Risk Index trend graph (Line chart)
- Safe limit reference lines
- 50-point rolling window display

## 🧮 Calculation Formulas

### Risk Index Formula
```
normalized = current_value / max_safe_limit

risk_index = (0.3 * ch4_norm) + 
             (0.3 * h2s_norm) + 
             (0.2 * co_norm) + 
             (0.2 * o2_deviation)

risk_percentage = risk_index * 100 (capped at 100%)
```

### Explosion Probability Formula
```
ch4_norm = ch4 / safe_limit_ch4
o2_norm = o2 / 21
temp_factor = (temperature + 273) / 298

explosion_risk = (ch4_norm * o2_norm * temp_factor) * 100 (capped at 100%)
```

### Exposure Time Logic
```
IF h2s > safe_limit:
    exposure_time = max_duration / excess_factor - elapsed_time
ELSE:
    exposure_time = ∞ (unlimited)
```

### Trend Arrow Logic
```
rate = current - previous

IF rate > threshold → ↑ (up arrow, red)
IF rate < -threshold → ↓ (down arrow, green)
ELSE → → (steady arrow, cyan)
```

## 🔄 Auto-Refresh System

- **Update Interval**: 5 seconds (configurable)
- **Data Points Kept**: 288 (24 hours at 5-second intervals)
- **Chart Display**: Last 50 data points
- **Automatic Recalculation**: All metrics update with each fetch

## 🎨 Color Scheme

| Status | Color | Hex |
|--------|-------|-----|
| Safe | Green | #00ff88 |
| Moderate | Yellow | #ffd700 |
| Danger | Orange | #ff6b35 |
| Critical | Red | #ff3333 |
| Primary | Cyan | #00d9ff |
| Background | Dark Navy | #0a0e27 |

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+ (Full layout)
- **Tablet**: 768px-1199px (2-column grid)
- **Mobile**: <768px (Stacked layout)

## 🔐 Safety Features

1. **Entry Permission System**: Prevents unsafe entries
2. **Flashing Alerts**: Critical conditions are highlighted
3. **Color Coding**: Intuitive status at a glance
4. **Predictive Alerts**: Warns before danger is reached
5. **Automatic Ventilation**: Fan activates when needed (Auto mode)
6. **Exposure Time Countdown**: Tracks safe exposure limits

## ⚙️ Configuration Options

Edit these values in `script.js` CONFIG object:

```javascript
CHANNEL_ID: 'YOUR_CHANNEL_ID',           // ThingSpeak channel
API_KEY: 'YOUR_API_KEY',                  // API authentication
REFRESH_INTERVAL: 5000,                   // 5 seconds
MAX_SAFE_EXPOSURE_TIME: 30,              // 30 minutes
EXPLOSION_RISK_THRESHOLD: 70,            // 70%
TREND_THRESHOLD: 50                       // PPM change threshold
```

## 🔗 ThingSpeak Integration

### API Endpoint Format
```
https://api.thingspeak.com/channels/YOUR_CHANNEL_ID/feeds.json?api_key=YOUR_API_KEY&results=10
```

### Expected JSON Response
```json
{
  "feeds": [
    {
      "created_at": "2026-02-18T10:30:45Z",
      "field1": 150,    // CH4
      "field2": 2.5,    // H2S
      "field3": 10,     // CO
      "field4": 20.9,   // O2
      "field5": 22      // Temperature
    }
  ]
}
```

## 📊 Expected Dashboard Behavior

1. **On Load**: Dashboard initializes with mock data
2. **Every 5 Seconds**: Fetches new data from API/mock source
3. **Auto-Calculates**:
   - Risk Index
   - Explosion Probability
   - Exposure Time
   - Trends
   - Recommendations
4. **Updates**:
   - Gas cards with values and colors
   - Charts with new data points
   - Entry permission status
   - Ventilation status
   - Alerts if conditions change

## 🎯 Usage Examples

### Example 1: Normal Conditions
- All gases within limits
- Risk Index: 5%
- Entry: ✅ ALLOWED
- Status: Green throughout

### Example 2: Warning Conditions
- H₂S slightly elevated
- Risk Index: 35%
- Entry: ❌ NOT ALLOWED
- Status: Yellow warning
- Recommendation: Wait & Ventilate

### Example 3: Critical Conditions
- Multiple gases elevated
- Risk Index: 80%
- Entry: ❌ ENTRY NOT ALLOWED
- Status: Red flashing
- Recommendation: EMERGENCY EVACUATION
- Fan: Auto-activated

## 🔍 Testing Tips

1. **Mock Data**: Dashboard generates realistic data automatically
2. **Change Thresholds**: Edit CONFIG values to test different scenarios
3. **Browser Console**: Check logs with F12 → Console
4. **Responsive Testing**: Resize browser to test mobile view
5. **Dark/Light Mode**: Click footer link to toggle theme

## 📥 Download Report

Users can download a text report with current readings:
- Click "Download Report" in footer
- Generates timestamped report
- Includes all current readings and safety status
- Exports as .txt file

## 🌓 Dark/Light Mode

- **Default**: Dark mode (industrial theme)
- **Toggle**: Click "Dark/Light Mode" in footer
- **Persistence**: Saves user preference in localStorage
- **Auto-switch**: Based on system preference on first visit

## 🚨 Critical Alert States

The dashboard triggers special behaviors when conditions are critical:

1. **Flashing Animations**: Exposure time < 2 minutes
2. **Red Pulsing Border**: Entry not allowed
3. **Warning Banner**: Gas levels rising toward danger
4. **Shaking Icon**: Entry denied with animated rejection
5. **Fan Auto-Activation**: When risk > 30% in auto mode

## 🐛 Troubleshooting

### Dashboard Shows Offline
- Check API key and channel ID are correct
- Verify internet connection
- Check browser console for errors (F12)

### Charts Not Displaying
- Wait 5-10 seconds for data to accumulate
- Check that Chart.js library loaded (no 404 errors)
- Try refreshing the page

### Real Data Not Showing
- Configure API key in script.js
- Uncomment the actual API call in fetchAndUpdateData()
- Comment out the mock data generation
- Check ThingSpeak channel for recent data

### Unresponsive on Mobile
- Device might be rotating - wait for layout to adjust
- Check browser supports CSS Grid
- Try a modern browser (Chrome, Firefox, Safari)

## 📝 Notes

- **Mock Data**: Perfect for demonstration and testing
- **Production Use**: Replace with actual ThingSpeak API
- **No Backend Required**: Pure front-end solution
- **Privacy**: All processing happens client-side
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest versions)

## 🎓 Learning Resources

- **ThingSpeak Docs**: https://thingspeak.com/docs
- **Chart.js Guide**: https://www.chartjs.org/docs/latest/
- **CSS Grid**: https://css-tricks.com/snippets/css/complete-guide-grid/
- **JavaScript Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

## 📄 License

This project is provided as-is for educational and operational purposes.

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

For questions or issues, consult the embedded comments in the source files.
