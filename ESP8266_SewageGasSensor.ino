/*
 * Arduino Uno Sewer Gas Sensor Node (MQ-2 + MQ-3 + MQ-4 + Buzzer + I2C LCD)
 *
 * Hardware:
 * - Arduino Uno
 * - MQ-2 on A0 (toxic/combustible sewer gas proxy)
 * - MQ-3 on A1 (flammable VOC/alcohol vapor)
 * - MQ-4 on A2 (methane)
 * - Active buzzer on D5 (GPIO14)
 * - 16x2 I2C LCD (0x27)
 *
 * Serial Output to ESP8266:
 * - CSV line: mq2_ppm,mq3_ppm,ch4_ppm,warnScore
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>

// ===== Hardware Pins =====
const int MQ2_PIN = A0;
const int MQ3_PIN = A1;
const int MQ4_PIN = A2;
const int BUZZER_PIN = 5;
const int ESP_RX_PIN = 2;
const int ESP_TX_PIN = 3;

// ===== Sensor Safety Limits (must match dashboard assumptions) =====
const float LIMIT_CH4 = 5000.0;   // MQ-4 methane
const float LIMIT_MQ2 = 25.0;     // MQ-2 toxic sewer gas proxy
const float LIMIT_MQ3 = 200.0;    // MQ-3 flammable VOC vapor

// ===== ADC & LCD =====
LiquidCrystal_I2C lcd(0x27, 16, 2);
SoftwareSerial espLink(ESP_RX_PIN, ESP_TX_PIN);

// ===== System Variables =====
unsigned long lastUpdateTime = 0;
unsigned long lastScreenSwitch = 0;
const unsigned long updateInterval = 30000;
const unsigned long lcdRotateInterval = 2000;
int lcdPage = 0;

// ===== Utility =====
float mapFloat(float x, float inMin, float inMax, float outMin, float outMax) {
  if (x < inMin) x = inMin;
  if (x > inMax) x = inMax;
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

String riskLabel(float ratio) {
  if (ratio < 0.6) return "SAFE";
  if (ratio < 1.0) return "WARN";
  if (ratio < 1.5) return "HIGH";
  return "CRIT";
}

int warningScore(float ch4, float mq2, float mq3) {
  float s1 = min((ch4 / LIMIT_CH4) * 100.0, 100.0);
  float s2 = min((mq2 / LIMIT_MQ2) * 100.0, 100.0);
  float s3 = min((mq3 / LIMIT_MQ3) * 100.0, 100.0);
  return (int)((0.3 * s1) + (0.35 * s2) + (0.35 * s3));
}

void beepPattern(float ch4, float mq2, float mq3) {
  bool critical = (ch4 > LIMIT_CH4) || (mq2 > LIMIT_MQ2) || (mq3 > LIMIT_MQ3);
  bool warning = (ch4 > LIMIT_CH4 * 0.8) || (mq2 > LIMIT_MQ2 * 0.8) || (mq3 > LIMIT_MQ3 * 0.8);

  if (critical) {
    tone(BUZZER_PIN, 2000, 250);
    delay(300);
    tone(BUZZER_PIN, 2000, 250);
  } else if (warning) {
    tone(BUZZER_PIN, 1400, 180);
  } else {
    noTone(BUZZER_PIN);
  }
}

float readVoltage(int analogPin) {
  int raw = analogRead(analogPin);
  return raw * 5.0 / 1023.0;
}

float readMqttToPpm(float voltage, float maxPpm) {
  return mapFloat(voltage, 0.2, 4.8, 0.0, maxPpm);
}

void showLcd(float ch4, float mq2, float mq3) {
  if (millis() - lastScreenSwitch >= lcdRotateInterval) {
    lcdPage = (lcdPage + 1) % 3;
    lastScreenSwitch = millis();
  }

  float ratioCH4 = ch4 / LIMIT_CH4;
  float ratioMQ2 = mq2 / LIMIT_MQ2;
  float ratioMQ3 = mq3 / LIMIT_MQ3;

  lcd.clear();
  if (lcdPage == 0) {
    lcd.setCursor(0, 0);
    lcd.print("CH4/MQ4:");
    lcd.print((int)ch4);
    lcd.setCursor(0, 1);
    lcd.print("Lvl:");
    lcd.print(riskLabel(ratioCH4));
  } else if (lcdPage == 1) {
    lcd.setCursor(0, 0);
    lcd.print("Toxic/MQ2:");
    lcd.print(mq2, 1);
    lcd.setCursor(0, 1);
    lcd.print("Lvl:");
    lcd.print(riskLabel(ratioMQ2));
  } else {
    lcd.setCursor(0, 0);
    lcd.print("VOC/MQ3:");
    lcd.print(mq3, 1);
    lcd.setCursor(0, 1);
    lcd.print("Lvl:");
    lcd.print(riskLabel(ratioMQ3));
  }
}

void setup() {
  Serial.begin(115200);
  espLink.begin(9600);
  delay(100);

  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);

  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sewer Gas Node");
  lcd.setCursor(0, 1);
  lcd.print("Booting...");

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Analog Inputs");
  lcd.setCursor(0, 1);
  lcd.print("To ESP8266");
}

void loop() {
  int rawMQ2 = analogRead(MQ2_PIN);
  int rawMQ3 = analogRead(MQ3_PIN);
  int rawMQ4 = analogRead(MQ4_PIN);

  float vMQ2 = rawMQ2 * 5.0 / 1023.0;
  float vMQ3 = rawMQ3 * 5.0 / 1023.0;
  float vMQ4 = rawMQ4 * 5.0 / 1023.0;

  // Approximate PPM mappings (must be calibrated for production accuracy)
  float mq2_ppm = readMqttToPpm(vMQ2, 120.0);
  float mq3_ppm = readMqttToPpm(vMQ3, 600.0);
  float ch4_ppm = readMqttToPpm(vMQ4, 12000.0);

  int warnScore = warningScore(ch4_ppm, mq2_ppm, mq3_ppm);

  Serial.println("========================================");
  Serial.print("MQ-2 Raw: "); Serial.print(rawMQ2); Serial.print("  Voltage: "); Serial.print(vMQ2, 2); Serial.println(" V");
  Serial.print("MQ-3 Raw: "); Serial.print(rawMQ3); Serial.print("  Voltage: "); Serial.print(vMQ3, 2); Serial.println(" V");
  Serial.print("MQ-4 Raw: "); Serial.print(rawMQ4); Serial.print("  Voltage: "); Serial.print(vMQ4, 2); Serial.println(" V");
  Serial.print("MQ-4 CH4: "); Serial.print(ch4_ppm, 2); Serial.println(" PPM");
  Serial.print("MQ-2 Toxic Index: "); Serial.print(mq2_ppm, 2); Serial.println(" PPM");
  Serial.print("MQ-3 VOC Vapor: "); Serial.print(mq3_ppm, 2); Serial.println(" PPM");
  Serial.print("Warning Score: "); Serial.println(warnScore);

  showLcd(ch4_ppm, mq2_ppm, mq3_ppm);
  beepPattern(ch4_ppm, mq2_ppm, mq3_ppm);

  String payload = String(mq2_ppm, 2) + "," + String(mq3_ppm, 2) + "," + String(ch4_ppm, 2) + "," + String(warnScore);
  espLink.println(payload);
  Serial.print("[UNO->ESP] ");
  Serial.println(payload);

  if (millis() - lastUpdateTime >= updateInterval) {
    lastUpdateTime = millis();
    Serial.println("[UNO] Sensor payload sent to ESP8266 for ThingSpeak upload.");
  }

  delay(300);
}
