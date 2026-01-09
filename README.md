# 🛡️ SafeHer - Your Guardian in Your Pocket

A comprehensive women's safety Progressive Web App (PWA) with emergency SOS, AI-powered distress detection, community reporting, and real-time safety features.

---

## ✨ Features

### 🚨 Core Safety Features
- **Emergency SOS Button** - One-tap panic alert with real-time location sharing
- **AI Distress Detection** - Gemini 3 Flash analyzes situations for danger signals
- **Emergency Contacts Management** - Instant notifications to trusted contacts
- **Community Safety Reporting** - Anonymous incident reporting and viewing
- **Interactive Safety Map** - Live map showing safe zones and reported incidents
- **Fake Call Generator** - Discrete exit strategy for uncomfortable situations
- **Real-time GPS Tracking** - Continuous location updates during emergencies
- **24/7 Monitoring** - Always-on protection

### 📱 Android Support (PWA)
- ✅ Installable as native-like app
- ✅ Works offline with cached data
- ✅ Home screen icon
- ✅ Fullscreen mode
- ✅ Push notifications ready
- ✅ Background sync

---

## 🚀 Quick Start for Android

1. **Open Chrome** on your Android device
2. **Visit:** Your deployed SafeHer URL
3. **Tap menu (⋮)** → "Install App"
4. **Tap "Install"** → App added to home screen
5. **Open SafeHer** from home screen like any app

📖 **Complete Guide:** See [ANDROID_GUIDE.md](./ANDROID_GUIDE.md)

---

## 🧪 All Tests Passing ✅

```
📡 Backend API Tests: ✓ PASSED
🗄️  Database Tests: ✓ PASSED  
🌐 Frontend Tests: ✓ PASSED
📱 PWA Features: ✓ PASSED

Total: 7/7 tests passing
```

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + Tailwind CSS + Framer Motion + React Leaflet
- **Backend:** FastAPI + Python + MongoDB
- **AI:** Gemini 3 Flash (via Emergent LLM Key)
- **Auth:** Emergent Google OAuth
- **Maps:** OpenStreetMap + Leaflet
- **PWA:** Service Worker + Manifest

---

## 🔌 Key API Endpoints

**Public:**
- `GET /api/` - Health check
- `GET /api/safety/zones` - List safe zones
- `GET /api/community/reports` - Community reports

**Protected (Auth Required):**
- `POST /api/emergency/trigger` - Trigger SOS
- `GET /api/emergency/contacts` - Emergency contacts
- `POST /api/community/reports` - Submit report
- `POST /api/ai/analyze-distress` - AI analysis

---

## 🎨 Design

**Protective Modernism Style:**
- Deep Night Violet (#2E1065) primary
- Hyper Red (#DC2626) for emergencies
- Warm Sand (#FAFAF9) backgrounds
- Outfit font for headings
- Plus Jakarta Sans for body
- Pill-shaped buttons
- Rounded 24px cards

---

## 📦 Installation

See full setup in project structure or run:
```bash
./test_functionality.sh  # Verify everything works
```

---

## 🚀 Deployment

App is deployed and running:
- **Frontend:** https://hersafety-2.preview.emergentagent.com
- **Backend:** https://hersafety-2.preview.emergentagent.com/api

---

## 🆘 In Real Emergencies

**Always call local emergency services:**
- India: 100 (Police), 112 (Emergency), 1091 (Women)
- US: 911
- UK: 999

SafeHer is a safety tool, not a replacement for emergency services.

---

**Built with 💜 for women's safety**
