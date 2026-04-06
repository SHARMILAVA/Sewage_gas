# 📱 Mobile Alert Notifications Setup Guide

## Overview

This guide will help you set up mobile notifications so you receive instant alerts on your phone when unsafe gas conditions are detected in the sewage monitoring system.

## 🎯 Notification Options

### Option 1: Telegram Bot (RECOMMENDED) ⭐
- **FREE** and instant
- Works on any modern smartphone
- No SMS charges
- Easy to set up (5 minutes)
- **Best for most users**

### Option 2: Email Notifications
- Works with Gmail, Outlook, Yahoo
- Slightly slower than Telegram
- Good as a backup option

### Option 3: Pushover
- Requires Pushover app ($5 one-time purchase)
- Very reliable
- Good for professional deployments

---

## 🤖 Setup Option 1: Telegram Bot (Recommended)

### Step 1: Install Telegram
1. Download **Telegram** app on your mobile:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=org.telegram.messenger)
   - iOS: [App Store](https://apps.apple.com/app/telegram-messenger/id686449807)
2. Create an account (if you don't have one)

### Step 2: Create Your Bot
1. Open Telegram and search for: **@BotFather**
2. Start a chat and send: `/newbot`
3. Follow the prompts:
   - **Bot Name**: "Sewage Gas Alert Bot" (or any name you like)
   - **Bot Username**: Must end with 'bot' (e.g., `my_sewage_alert_bot`)
4. **BotFather will reply with your Bot Token**. Copy it!
   - Example: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### Step 3: Get Your Chat ID
1. Open Telegram and search for: **@userinfobot**
2. Start a chat with it
3. It will reply with your **Chat ID** (a number like `123456789`)
4. Copy this number

### Step 4: Configure the System
1. Open the file: `notifications.js`
2. Find the **Telegram configuration section** (around line 14):
   ```javascript
   telegram: {
       enabled: true,  // Make sure this is true
       botToken: 'YOUR_BOT_TOKEN',  // Paste your Bot Token here
       chatId: 'YOUR_CHAT_ID'       // Paste your Chat ID here
   }
   ```
3. Replace `YOUR_BOT_TOKEN` with the token from BotFather
4. Replace `YOUR_CHAT_ID` with your Chat ID from userinfobot
5. **Save the file**

### Step 5: Test the Setup
1. Start your bot by searching for your bot username in Telegram
2. Send `/start` to your bot
3. Restart your server (run `start-server.ps1`)
4. You should see in the terminal:
   ```
   🛡️ Starting automated safety monitoring...
   📱 Mobile notifications: ENABLED (Telegram)
   ```

### Step 6: Trigger a Test Alert
**Option A:** Wait for the next safety check (happens every 60 seconds)

**Option B:** Manually trigger a test by temporarily lowering the thresholds:
1. In `notifications.js`, find `SAFE_LIMITS` (around line 37)
2. Temporarily set `H2S: 0.1` instead of `10`
3. Restart the server
4. You should receive a test alert within 60 seconds
5. **Remember to change it back to `10` after testing!**

---

## 📧 Setup Option 2: Email Notifications

### Prerequisites
- Gmail account (or other email service)
- Gmail App Password (not your regular password)

### Step 1: Generate Gmail App Password
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Search for **App passwords**
5. Generate a new app password:
   - App: **Mail**
   - Device: **Other (Custom name)** → "Sewage Gas Alert"
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Install Nodemailer Package
Open PowerShell in your project folder and run:
```powershell
npm install nodemailer
```

### Step 3: Configure Email Settings
1. Open `notifications.js`
2. Find the **Email configuration** (around line 21):
   ```javascript
   email: {
       enabled: true,  // Change to true
       service: 'gmail',
       user: 'your-email@gmail.com',  // Your Gmail address
       password: 'your-app-password',  // App password from Step 1
       recipient: 'your-mobile-email@gmail.com'  // Where to receive alerts
   }
   ```
3. Fill in your details
4. **Save the file**

### Step 4: Test Email Alerts
1. Restart your server
2. Email alerts will be sent alongside Telegram alerts (or alone if Telegram is disabled)

---

## 📢 Setup Option 3: Pushover

### Step 1: Install Pushover App
1. Purchase Pushover app ($5 one-time):
   - Android: [Google Play](https://play.google.com/store/apps/details?id=net.superblock.pushover)
   - iOS: [App Store](https://apps.apple.com/app/pushover-notifications/id506088175)
2. Create an account at: https://pushover.net/

### Step 2: Get Credentials
1. Log into https://pushover.net/
2. Your **User Key** is displayed on the dashboard
3. Create a new application:
   - Name: "Sewage Gas Monitor"
   - Copy the **API Token/Key**

### Step 3: Configure Pushover
1. Open `notifications.js`
2. Find the Pushover section (around line 30):
   ```javascript
   pushover: {
       enabled: true,  // Change to true
       userKey: 'YOUR_USER_KEY',  // From Step 2
       appToken: 'YOUR_APP_TOKEN'  // From Step 2
   }
   ```
3. Fill in your credentials
4. **Save the file**

---

## ⚙️ Configuration Options

### Adjust Alert Cooldown
To prevent alert spam, there's a cooldown period between alerts.

In `notifications.js`, find (around line 36):
```javascript
// Alert cooldown (prevent spam) - minutes
alertCooldown: 5,  // Change this number (in minutes)
```

**Recommendation:** 5 minutes for testing, 15-30 minutes for production.

### Customize Safety Thresholds
In `notifications.js`, find the `SAFE_LIMITS` section (around line 39):
```javascript
SAFE_LIMITS: {
    CH4: 5000,      // Methane (PPM)
    H2S: 10,        // Hydrogen Sulfide (PPM)
    CO: 35,         // Carbon Monoxide (PPM)
    O2_MIN: 19.5,   // Oxygen minimum (%)
    O2_MAX: 23.5,   // Oxygen maximum (%)
    RISK_INDEX: 50  // Risk index threshold (%)
}
```

Adjust these values based on your specific requirements.

---

## 🚨 Alert Levels

The system sends alerts with different severity levels:

### 🟢 INFO
- General updates
- System status changes

### 🟡 WARNING
- Gas levels above safe limits but not critical
- O2 levels outside normal range
- Risk index 50-75%

### 🔴 CRITICAL
- H2S exceeds 2x safe limit
- Risk index > 75%
- Immediate evacuation required

---

## 📊 How Alerts Work

The system monitors your sensor data every **60 seconds** and checks:

1. **Critical Gas Levels**
   - H2S > 20 PPM → CRITICAL alert
   - CH4 > 5000 PPM → WARNING alert
   - CO > 35 PPM → WARNING alert

2. **Oxygen Levels**
   - O2 < 19.5% or > 23.5% → WARNING alert

3. **Risk Index**
   - Risk > 50% → WARNING alert
   - Risk > 75% → CRITICAL alert

4. **Alert Cooldown**
   - After sending an alert, the system waits 5 minutes before sending another
   - Prevents notification spam
   - Critical alerts override cooldown

---

## 🔧 Troubleshooting

### Telegram Not Working

**Problem:** "Bot not found" error
- **Solution:** Make sure you sent `/start` to your bot in Telegram first

**Problem:** "Chat not found" error
- **Solution:** Double-check your Chat ID. Make sure it's a number, not your username

**Problem:** "Unauthorized" error
- **Solution:** Verify your Bot Token is correct. Get a new one from @BotFather if needed

### Email Not Working

**Problem:** "Invalid login" error
- **Solution:** Use an **App Password**, not your regular Gmail password
- **Solution:** Make sure 2-Step Verification is enabled in your Google account

**Problem:** Module not found error
- **Solution:** Run `npm install nodemailer` in your project folder

### No Alerts Being Sent

**Problem:** Server says "Conditions safe" but you want to test
- **Solution:** Temporarily lower the thresholds in `notifications.js` (see Step 6 of Telegram setup)

**Problem:** "Alert cooldown active"
- **Solution:** This is normal. Wait for the cooldown period to expire, or reduce it in the config

---

## 📱 Using Multiple Notification Methods

You can enable **multiple notification methods** at the same time:

1. In `notifications.js`, set multiple `enabled: true`
   ```javascript
   telegram: { enabled: true, ... },
   email: { enabled: true, ... },
   pushover: { enabled: true, ... }
   ```

2. Alerts will be sent to **all enabled channels** simultaneously

**Recommendation:** Use Telegram as primary + Email as backup.

---

## 🎯 Quick Start Checklist

- [ ] Install Telegram app
- [ ] Create bot with @BotFather (get Bot Token)
- [ ] Get Chat ID from @userinfobot
- [ ] Edit `notifications.js` with your credentials
- [ ] Set `enabled: true` for Telegram
- [ ] Save the file
- [ ] Restart server with `start-server.ps1`
- [ ] Send `/start` to your bot
- [ ] Wait for first alert or trigger a test

---

## 💡 Tips

1. **Test Before Deployment:** Trigger a test alert to make sure everything works
2. **Multiple Recipients:** Create a Telegram group, add your bot, and use the group Chat ID
3. **Backup Alerts:** Enable both Telegram AND Email for redundancy
4. **Customize Messages:** Edit `notifications.js` to customize alert message format
5. **Adjust Sensitivity:** Modify thresholds based on your specific environment

---

## 📞 Need Help?

If you're stuck, check:
1. Server console logs for error messages
2. Make sure your ESP8266 is sending data to ThingSpeak
3. Verify your credentials are correct (no extra spaces)
4. Test your bot separately by messaging it directly

---

## 🎉 Success!

Once configured, you'll receive instant mobile alerts whenever unsafe conditions are detected. The system automatically monitors your gas levels 24/7 and keeps you informed!

**Stay safe!** 🛡️
