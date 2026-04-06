/*
 * ESP8266 ThingSpeak Gateway for Arduino Uno Sewer Gas Node
 *
 * Role:
 * - Receives CSV sensor packets from Arduino Uno over serial
 * - Uploads sensor values to ThingSpeak
 *
 * Packet format from Uno:
 * - mq2_ppm,mq3_ppm,ch4_ppm,warnScore
 *
 * ThingSpeak mapping:
 * - field1: MQ-4 methane (PPM)
 * - field2: MQ-2 toxic gas index (PPM)
 * - field3: MQ-3 VOC vapor (PPM)
 * - field5: warning score (0-100)
 *
 * Wiring:
 * - Uno TX (SoftwareSerial pin 3) -> ESP8266 RX (D6 / GPIO12) through level shifting
 * - Common GND required
 * - ESP8266 RX is 3.3V only
 */

#include <ESP8266WiFi.h>
#include <SoftwareSerial.h>

// ===== WiFi Settings =====
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// ===== ThingSpeak Settings =====
const char* server = "api.thingspeak.com";
const String writeApiKey = "7T87BYDB4F00FF24";

// ===== Uno Serial Link =====
const int UNO_RX_PIN = D6; // ESP8266 RX reads Uno TX
const int UNO_TX_PIN = D5; // optional debug/ack line
SoftwareSerial unoLink(UNO_RX_PIN, UNO_TX_PIN);

WiFiClient client;

String incomingLine;
unsigned long lastUploadTime = 0;
const unsigned long minUploadInterval = 30000;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("[WIFI] Connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print('.');
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected");
    Serial.print("[WIFI] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Connection failed");
  }
}

bool parsePacket(const String& line, float& mq2, float& mq3, float& ch4, int& warnScore) {
  int firstComma = line.indexOf(',');
  int secondComma = line.indexOf(',', firstComma + 1);
  int thirdComma = line.indexOf(',', secondComma + 1);
  if (firstComma < 0 || secondComma < 0 || thirdComma < 0) return false;

  mq2 = line.substring(0, firstComma).toFloat();
  mq3 = line.substring(firstComma + 1, secondComma).toFloat();
  ch4 = line.substring(secondComma + 1, thirdComma).toFloat();
  warnScore = line.substring(thirdComma + 1).toInt();
  return true;
}

void sendToThingSpeak(float mq2, float mq3, float ch4, int warnScore) {
  connectWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  if (millis() - lastUploadTime < minUploadInterval) {
    Serial.println("[THINGSPEAK] Upload skipped due to interval limit");
    return;
  }

  if (!client.connect(server, 80)) {
    Serial.println("[THINGSPEAK] Connection failed");
    return;
  }

  String url = "/update?api_key=" + writeApiKey;
  url += "&field1=" + String(ch4, 2);
  url += "&field2=" + String(mq2, 2);
  url += "&field3=" + String(mq3, 2);
  url += "&field5=" + String(warnScore);

  client.print(String("GET ") + url + " HTTP/1.1\r\n" +
               "Host: api.thingspeak.com\r\n" +
               "Connection: close\r\n\r\n");

  unsigned long timeout = millis();
  while (client.connected() && millis() - timeout < 5000) {
    while (client.available()) {
      String line = client.readStringUntil('\n');
      if (line.indexOf("200") >= 0 || line.indexOf("OK") >= 0) {
        Serial.println("[THINGSPEAK] Data sent successfully");
      }
    }
  }

  client.stop();
  lastUploadTime = millis();
}

void setup() {
  Serial.begin(115200);
  unoLink.begin(9600);
  delay(1000);

  Serial.println();
  Serial.println("ESP8266 ThingSpeak Gateway ready");
  connectWiFi();
}

void loop() {
  while (unoLink.available()) {
    char c = unoLink.read();
    if (c == '\n') {
      incomingLine.trim();
      if (incomingLine.length() > 0) {
        float mq2 = 0.0;
        float mq3 = 0.0;
        float ch4 = 0.0;
        int warnScore = 0;

        if (parsePacket(incomingLine, mq2, mq3, ch4, warnScore)) {
          Serial.print("[UNO] ");
          Serial.println(incomingLine);
          sendToThingSpeak(mq2, mq3, ch4, warnScore);
        } else {
          Serial.print("[PARSE] Invalid packet: ");
          Serial.println(incomingLine);
        }
      }
      incomingLine = "";
    } else if (c != '\r') {
      incomingLine += c;
      if (incomingLine.length() > 80) {
        incomingLine = "";
      }
    }
  }

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
}
