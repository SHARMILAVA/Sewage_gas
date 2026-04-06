# ⚡ QUICK REFERENCE - ThingSpeak + ESP8266 + Dashboard

## 🔑 YOUR CREDENTIALS (Fill in after ThingSpeak setup)

```
ThingSpeak Channel ID:      _____________________
Write API Key (ESP8266):    _____________________
Read API Key (Dashboard):   _____________________
WiFi SSID:                  _____________________
WiFi Password:              _____________________
```

---

## 📝 What Goes Where

### 1️⃣ ESP8266 Arduino Code (3 places to edit)

```cpp
const char* ssid = "YOUR_WIFI_NAME";              // ← Line 5
const char* password = "YOUR_WIFI_PASSWORD";      // ← Line 6
const String writeApiKey = "YOUR_WRITE_API_KEY";  // ← Line 9
const int channelID = 12345;                      // ← Line 10 (Channel ID as number)
```

### 2️⃣ Dashboard script.js (2 places to edit)

**Location: Around line 8-10**
```javascript
const CONFIG = {
    THINGSPEAK_CHANNEL_ID: 'YOUR_CHANNEL_ID',        // ← Your Channel ID as STRING
    THINGSPEAK_READ_API_KEY: 'YOUR_READ_API_KEY',    // ← Your Read API Key
    REFRESH_INTERVAL: 30000,
```

---

## 🔄 Data Flow Diagram

```
MQ2 Sensor (Analog Pin)
        ↓
ESP8266 (Reads & Calculates)
        ↓
ThingSpeak Cloud (Stores Data)
        ↓
Your Website (Displays & Analyzes)
```

---

## 🎯 Checklist

Before running:

- [ ] ThingSpeak account created
- [ ] Channel created with 5 fields
- [ ] API Keys copied
- [ ] ESP8266 WiFi credentials entered
- [ ] ESP8266 Write API Key entered
- [ ] Dashboard script.js updated with:
  - [ ] Channel ID
  - [ ] Read API Key
- [ ] MQ2 sensor wired to A0 pin
- [ ] ESP8266 powered and uploading
- [ ] Serial Monitor shows "WiFi Connected"
- [ ] ThingSpeak shows incoming data
- [ ] Dashboard shows data (not offline)

---

## 📡 Testing Steps (In Order)

### ✓ Test 1: Arduino Upload
```
1. Open Arduino IDE
2. Select Board: NodeMCU 1.0
3. Select Port: COM3 (or your port)
4. Click Upload
5. Watch Serial Monitor (115200 baud)
6. Should see: "WiFi Connected!" + IP address
```

### ✓ Test 2: ThingSpeak Receiving
```
1. Wait 30 seconds after ESP8266 starts
2. Go to ThingSpeak channel → Private View
3. Should see chart updating with values
```

### ✓ Test 3: Dashboard Fetching
```
1. Open http://localhost:8000
2. Open Browser Console (F12)
3. Should see logs:
   - "Real Data from ThingSpeak"
   - Not "Using mock data"
4. Gas values should not be random
```

---

## 🔴 Red Flags (Something's Wrong)

| Issue | Cause | Solution |
|-------|-------|----------|
| Dashboard says "Offline" | Wrong API Key or Channel ID | Check script.js config |
| No data in ThingSpeak | WiFi not connecting | Check WiFi credentials in sketch |
| MQ2 always reads 0 | Sensor not powered | Check 5V power supply |
| Dashboard still shows mock | API key is wrong | Copy exactly from ThingSpeak |

---

## 🚨 Common Mistakes

❌ **Channel ID as string in ESP8266**
```cpp
// WRONG:
const int channelID = "2456789";  // This is a string!

// RIGHT:
const int channelID = 2456789;  // Just numbers
```

❌ **Channel ID as number in Dashboard**
```javascript
// WRONG:
THINGSPEAK_CHANNEL_ID: 2456789,  // This is a number!

// RIGHT:
THINGSPEAK_CHANNEL_ID: '2456789',  // As string
```

❌ **Using wrong API key**
```cpp
// Wrong - using READ key in ESP8266:
const String writeApiKey = "READ_API_KEY_HERE";  // ✗

// Right - using WRITE key:
const String writeApiKey = "WRITE_API_KEY_HERE";  // ✓
```

---

## 📊 Expected Data Format

Your ThingSpeak channel should have:

```
Field 1: CH4 (Methane)              → Range: 0-5000 PPM
Field 2: H2S (Hydrogen Sulfide)     → Range: 0-100 PPM
Field 3: CO (Carbon Monoxide)       → Range: 0-500 PPM
Field 4: O2 (Oxygen)                → Range: 15-25 %
Field 5: Temperature                → Range: 0-50 °C
```

---

## 🎓 How the Dashboard Works

1. **Fetches** real data from ThingSpeak (every 30 seconds)
2. **Stores** historical data (last 100 readings)
3. **Calculates** risk index using formulas
4. **Analyzes** trends (↑ ↓ →)
5. **Predicts** explosion probability
6. **Recommends** safety actions
7. **Updates** UI with real-time status

---

## 🔗 Useful Links

- ThingSpeak: https://thingspeak.com
- ThingSpeak API Docs: https://thingspeak.com/docs/api
- ESP8266 Arduino: https://github.com/esp8266/Arduino
- MQ2 Sensor Datasheet: https://www.olimex.com/Products/Modules/Sensors/MOD-ENV/resources/MQ2-datasheet.pdf

---

## 💬 Debug Tips

**To see what's happening:**
```cpp
// Add Serial.println() everywhere:
Serial.println("WiFi connecting...");
Serial.println("Read value: " + String(analogRead(MQ2_PIN)));
Serial.println("Sending to ThingSpeak...");
```

**Open Browser Console (F12) for Dashboard logs:**
```javascript
// Look for messages like:
// ✅ Real Data from ThingSpeak
// ❌ ThingSpeak API Error
// Channel ID: ...
// API Key: ...
```

---

## 🎉 Success!

When everything works:
- ✅ ESP8266 connected to WiFi
- ✅ Data flowing to ThingSpeak
- ✅ Dashboard showing real values
- ✅ Charts updating live
- ✅ Risk calculations working
- ✅ Safety recommendations generating

**You're monitoring your sewage tunnel in real-time!** 🚀

---

**Print this page or bookmark it for reference!**
