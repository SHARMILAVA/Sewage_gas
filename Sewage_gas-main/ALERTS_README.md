# 🚨 Mobile Alert System - Quick Start

## What Was Added

Your sewage gas monitoring system now has **automatic mobile notifications**! The system will send you instant alerts on your phone when unsafe gas conditions are detected.

## 📁 New Files

1. **`notifications.js`** - Core notification engine (Telegram, Email, Pushover support)
2. **`MOBILE_ALERTS_SETUP.md`** - Complete setup guide with step-by-step instructions
3. **`alert-config.json`** - Sample configuration file
4. **`server.js`** - Updated with automatic safety monitoring

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Telegram
- Download Telegram app on your phone from App Store/Play Store

### Step 2: Create Bot
1. Open Telegram, search for **@BotFather**
2. Send: `/newbot`
3. Follow prompts to create your bot
4. **Save the Bot Token** (looks like: `123456789:ABCdef...`)

### Step 3: Get Your Chat ID
1. Search for **@userinfobot** in Telegram
2. Send it a message
3. **Save your Chat ID** (a number like: `123456789`)

### Step 4: Configure System
1. Open **`notifications.js`** in your editor
2. Find this section (around line 14):
   ```javascript
   telegram: {
       enabled: true,  // Make sure this is true
       botToken: 'YOUR_BOT_TOKEN',  // ← Paste your Bot Token here
       chatId: 'YOUR_CHAT_ID'       // ← Paste your Chat ID here
   }
   ```
3. Replace the placeholder values with your actual credentials
4. **Save the file**

### Step 5: Start Your Bot
1. In Telegram, search for your bot username
2. Click **Start** or send `/start`

### Step 6: Run the Server
```powershell
.\start-server.ps1
```

You should see:
```
🛡️ Starting automated safety monitoring...
📱 Mobile notifications: ENABLED (Telegram)
```

## ✅ Done!

Your system is now monitoring gas levels automatically. When unsafe conditions are detected, you'll receive instant alerts on your phone via Telegram!

## 🎯 How It Works

- **Automatic Monitoring:** Checks gas levels every 60 seconds
- **Smart Alerts:** Only sends alerts when conditions are unsafe
- **Alert Cooldown:** 5-minute cooldown between alerts (prevents spam)
- **Three Severity Levels:**
  - 🟢 **INFO** - General updates
  - 🟡 **WARNING** - Gas levels above safe limits
  - 🔴 **CRITICAL** - Immediate evacuation required

## 🔍 Alert Triggers

You'll receive alerts when:
- ❌ **H2S > 10 PPM** (Hydrogen Sulfide)
- ❌ **CH4 > 5000 PPM** (Methane)
- ❌ **CO > 35 PPM** (Carbon Monoxide)
- ❌ **O2 outside 19.5-23.5%** (Oxygen)
- ❌ **Risk Index > 50%**

## 📱 Additional Options

### Use Email Instead
See [MOBILE_ALERTS_SETUP.md](MOBILE_ALERTS_SETUP.md) for Email setup instructions.

### Use Multiple Notification Methods
Enable both Telegram AND Email for redundancy - just set both to `enabled: true`.

### Customize Alert Settings
Edit thresholds and cooldown periods in `notifications.js` (see lines 36-47).

## 🔧 Troubleshooting

### Not receiving alerts?
1. Did you send `/start` to your bot in Telegram?
2. Check server console for error messages
3. Verify your Bot Token and Chat ID are correct
4. Make sure `enabled: true` in the config

### Want to test it?
Temporarily lower the H2S threshold to trigger an alert:
1. In `notifications.js`, change `H2S: 10` to `H2S: 0.1`
2. Restart server
3. You should get an alert within 60 seconds
4. **Change it back to 10 after testing!**

## 📖 Full Documentation

For detailed setup instructions, troubleshooting, and advanced configuration:
👉 **Read [MOBILE_ALERTS_SETUP.md](MOBILE_ALERTS_SETUP.md)**

## 🎉 Stay Safe!

Your sewage gas monitoring system is now equipped with 24/7 automatic mobile alerts. The system will keep watch and notify you immediately if unsafe conditions are detected.

**No need to constantly check the dashboard - we'll alert you when it matters!** 🛡️
