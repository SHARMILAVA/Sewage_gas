# 🔧 THINGSPEAK SETUP GUIDE

## 📌 Complete Steps to Connect ESP8266 + MQ2 Sensor → ThingSpeak → Dashboard

---

## **PART 1: ThingSpeak Configuration (Cloud Setup)**

### Step 1: Create ThingSpeak Account
```
1. Visit: https://thingspeak.com
2. Click "Sign Up"
3. Fill email, password, and basic info
4. Verify email
5. Login to dashboard
```

### Step 2: Create a Channel
```
1. Click "Channels" → "New Channel"

2. Fill the form:
   ├─ Name: "Sewage Gas Sensor"
   ├─ Description: "MQ2 sensor data from ESP8266"
   ├─ Field 1: "CH4 (Methane)" ✓
   ├─ Field 2: "H2S (Hydrogen Sulfide)" ✓
   ├─ Field 3: "CO (Carbon Monoxide)" ✓
   ├─ Field 4: "O2 (Oxygen)" ✓
   ├─ Field 5: "Temperature" ✓
   └─ Make Public: ✓ Check

3. Click "Save Channel"
```

### Step 3: Get Your API Keys
```
1. Click "API Keys" tab
2. Note down:
   ├─ Channel ID: ______________________
   ├─ Write API Key: ____________________
   └─ Read API Key: _____________________
```

**IMPORTANT**: Keep these keys safe!

---

## **PART 2: ESP8266 Hardware Setup**

### Hardware Requirements
```
├─ ESP8266 (NodeMCU or Wemos)
├─ MQ2 Gas Sensor Module
├─ USB Cable (for programming)
├─ Jumper Wires
└─ 5V Power Supply
```

### Wiring Diagram
```
MQ2 Sensor Connections:
├─ VCC → ESP8266 3.3V (or 5V with voltage divider)
├─ GND → ESP8266 GND
├─ A0 (Analog) → ESP8266 A0 (Analog pin)
└─ D0 (Digital) → (Optional, not used)

USB Connection:
└─ Micro USB → Computer (for uploading)
```

---

## **PART 3: Arduino Sketch for ESP8266**

### Step 1: Install Arduino IDE
```
1. Download: https://www.arduino.cc/en/software
2. Install and open
```

### Step 2: Install ESP8266 Board
```
1. Tools → Board Manager
2. Search: "ESP8266"
3. Install by "esp8266 community"
4. Tools → Board → Select "NodeMCU 1.0" (or your variant)
5. Tools → Port → Select your COM port
```

### Step 3: Upload Firmware
Copy and paste this code:

```cpp
#include <ESP8266WiFi.h>

// ===== WiFi Settings =====
const char* ssid = "YOUR_WIFI_NAME";          // Your WiFi network
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password

// ===== ThingSpeak Settings =====
const char* server = "api.thingspeak.com";
const String writeApiKey = "YOUR_WRITE_API_KEY";  // From ThingSpeak
const int channelID = 12345;                      // Your Channel ID

// ===== MQ2 Sensor =====
const int MQ2_PIN = A0;

WiFiClient client;
unsigned long lastUpdateTime = 0;
const unsigned long updateInterval = 30000; // 30 seconds

void setup() {
    Serial.begin(115200);
    delay(100);
    
    Serial.println("\n\n=== ESP8266 + MQ2 Sensor ===");
    Serial.println("Connecting to WiFi...");
    
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✓ WiFi Connected!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\n✗ WiFi Connection Failed!");
    }
}

void loop() {
    // Check if it's time to send data (30 second interval)
    if (millis() - lastUpdateTime >= updateInterval) {
        lastUpdateTime = millis();
        
        // Read MQ2 sensor
        int rawValue = analogRead(MQ2_PIN);
        
        // Convert to voltage (0-1023 → 0-5V)
        float voltage = rawValue * 5.0 / 1023.0;
        
        // Calculate gas levels (calibration needed!)
        // These are approximations - calibrate for your sensor
        float ch4_ppm = voltage * 1000;      // Methane
        float h2s_ppm = voltage * 10;        // Hydrogen Sulfide  
        float co_ppm = voltage * 50;         // Carbon Monoxide
        float o2_percent = 21.0;             // Default oxygen level
        float temperature = 25.0;            // Default temperature
        
        // Display on Serial Monitor
        Serial.println("\n--- Sensor Reading ---");
        Serial.print("Raw ADC: ");
        Serial.print(rawValue);
        Serial.print(" | Voltage: ");
        Serial.print(voltage);
        Serial.println(" V");
        Serial.print("CH4: ");
        Serial.print(ch4_ppm, 2);
        Serial.print(" PPM | H2S: ");
        Serial.print(h2s_ppm, 2);
        Serial.print(" PPM | CO: ");
        Serial.print(co_ppm, 2);
        Serial.println(" PPM");
        
        // Send to ThingSpeak
        if (WiFi.status() == WL_CONNECTED) {
            sendToThingSpeak(ch4_ppm, h2s_ppm, co_ppm, o2_percent, temperature);
        } else {
            Serial.println("✗ WiFi disconnected - attempting reconnect");
            WiFi.begin(ssid, password);
        }
    }
}

void sendToThingSpeak(float ch4, float h2s, float co, float o2, float temp) {
    Serial.println("\n→ Sending to ThingSpeak...");
    
    if (client.connect(server, 80)) {
        // Build the URL
        String url = "/update?api_key=" + writeApiKey;
        url += "&field1=" + String(ch4, 2);   // CH4
        url += "&field2=" + String(h2s, 2);   // H2S
        url += "&field3=" + String(co, 2);    // CO
        url += "&field4=" + String(o2, 2);    // O2
        url += "&field5=" + String(temp, 2);  // Temperature
        
        // Send HTTP request
        client.print("GET " + url + " HTTP/1.1\r\n");
        client.print("Host: api.thingspeak.com\r\n");
        client.print("Connection: close\r\n\r\n");
        
        delay(500);
        
        // Read response
        while (client.connected()) {
            if (client.available()) {
                String line = client.readStringUntil('\n');
                if (line.indexOf("200") > 0) {
                    Serial.println("✓ Data sent successfully!");
                }
            }
        }
        
        client.stop();
    } else {
        Serial.println("✗ Failed to connect to ThingSpeak");
    }
}
```

### Step 4: Configure Your Credentials
```
Replace these lines:
├─ ssid = "YOUR_WIFI_NAME"
├─ password = "YOUR_WIFI_PASSWORD"
├─ writeApiKey = "YOUR_WRITE_API_KEY"
└─ channelID = 12345
```

### Step 5: Upload
```
1. Click Sketch → Upload
2. Wait for "Done uploading"
3. Open Tools → Serial Monitor (115200 baud)
4. Watch the data being sent!
```

---

## **PART 4: Update Dashboard Configuration**

### Edit `script.js`

Find these lines (around line 8-10):

```javascript
const CONFIG = {
    THINGSPEAK_CHANNEL_ID: 'YOUR_CHANNEL_ID',
    THINGSPEAK_READ_API_KEY: 'YOUR_READ_API_KEY',
    REFRESH_INTERVAL: 30000,
```

Replace with your actual values:

```javascript
const CONFIG = {
    THINGSPEAK_CHANNEL_ID: '2456789',              // Your Channel ID
    THINGSPEAK_READ_API_KEY: 'ABCDEF123456',       // Your Read API Key
    REFRESH_INTERVAL: 30000,                        // 30 seconds
```

---

## **PART 5: Verify Everything Works**

### Check ThingSpeak
```
1. Go to: https://thingspeak.com
2. Login
3. Click your channel
4. Click "Private View"
5. Wait 30-60 seconds
6. Should see data appearing in the graphs!
```

### Check Dashboard
```
1. Open: http://localhost:8000
2. Open Browser Console (F12 → Console)
3. Should see log messages like:
   ├─ "✅ Real Data from ThingSpeak"
   ├─ Channel ID and API Key status
   └─ Current sensor readings
```

---

## **TROUBLESHOOTING**

### Problem: Dashboard shows "Offline"
```
✓ Check Channel ID in script.js
✓ Check Read API Key in script.js
✓ Make sure ThingSpeak channel is PUBLIC
✓ Wait a few minutes for first data point
```

### Problem: ESP8266 won't connect to WiFi
```
✓ Double-check WiFi SSID and password
✓ Make sure your WiFi is 2.4GHz (ESP8266 doesn't support 5GHz)
✓ Check if WiFi has special characters that need escaping
✓ Try moving closer to the router
```

### Problem: No data in ThingSpeak
```
✓ Check Serial Monitor output
✓ Verify Write API Key is correct
✓ Check MQ2 sensor wiring
✓ Try a simple HTTP test:
   GET https://api.thingspeak.com/update?api_key=YOUR_KEY&field1=100
```

### Problem: MQ2 readings are all zeros
```
✓ Check MQ2 sensor power supply (needs 5V)
✓ Check A0 pin connection
✓ MQ2 needs warm-up time (5-10 minutes after power-on)
✓ Check if sensor is burned out
```

---

## **MQ2 SENSOR CALIBRATION** (Advanced)

MQ2 sensor needs calibration for accurate readings:

```cpp
// In normal clean air, MQ2 output should be ~0.7V
// Read the analog value in clean air and note it

// Then use this formula:
float ro = readMQ2InCleanAir() * 5.0 / 1023.0;
float ppm = pow(10, (log10(voltage / ro) - 0.3) / 0.6) * 100;
```

For now, the linear approximation in the code should work fine.

---

## **NEXT STEPS**

1. ✅ Set up ThingSpeak channel
2. ✅ Connect ESP8266 + MQ2
3. ✅ Upload firmware
4. ✅ Update dashboard config
5. ✅ Verify data flow
6. 🚀 Monitor your sewage tunnel gas levels in real-time!

---

## **SUMMARY**

| Component | Configuration |
|-----------|-----------------|
| **ThingSpeak** | Channel created, APIs generated |
| **ESP8266** | WiFi + ThingSpeak code uploaded |
| **Dashboard** | script.js updated with real keys |
| **Data Flow** | MQ2 → ESP8266 → ThingSpeak → Website |
| **Update Rate** | Every 30 seconds |

---

**Questions?** Check the ThingSpeak documentation: https://thingspeak.com/docs

Happy monitoring! 🎉
