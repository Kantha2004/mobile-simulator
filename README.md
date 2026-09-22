# 📱 Mobile & Phone Simulator - Chrome Extension (Manifest V3)

A high-performance responsive web tester and mobile device simulator for Google Chrome. Test any website, web app, or `localhost` project on realistic mobile and tablet device frames with instant viewport switching, orientation toggle, touch cursor simulation, and QR code export.

---

## ✨ Features

- **📱 Realistic Device Mockups**:
  - **Apple iPhones**: iPhone 16 Pro Max, iPhone 16 Pro, iPhone 15/14 Pro (with Dynamic Island), iPhone 14/13, iPhone 13 mini, iPhone SE (3rd Gen).
  - **Android Smartphones**: Samsung Galaxy S24 Ultra, Samsung Galaxy S24, Google Pixel 8 Pro, Google Pixel 8a, Galaxy Z Fold 5 (Cover & Unfolded).
  - **Tablets**: iPad Pro 12.9", iPad Air 11" (M2), iPad mini 6, Samsung Galaxy Tab S9.
  - **Custom Devices**: Configure any custom width, height, and DPR.
- **🔄 Orientation Switcher**: 1-click toggle between Portrait and Landscape modes.
- **🔍 Smart Scaling**: Auto-fit to screen, 50%, 67%, 75%, 85%, 100%, or 125% zoom.
- **🖼️ Bezel Mockup Toggle**: Switch between realistic hardware chassis (with titanium finishes & side buttons) and clean frameless viewport.
- **🎨 Chassis Finishes**: Switch between Titanium Dark, Titanium Silver, and Titanium Natural.
- **👆 Touch Cursor Simulation**: Emulated mobile circular touch pointer with click ripple animation.
- **🔓 Seamless Site Embedding**: Built-in `declarativeNetRequest` engine strips `X-Frame-Options` and `Content-Security-Policy: frame-ancestors` on subframes, allowing almost any public website or local dev server to load.
- **📸 1-Click Screenshot**: Capture snapshots of the current simulated screen.
- **📱 Real Phone QR Code**: Generates an instant offline QR code for the current URL so you can scan and test directly on your physical smartphone.
- **⚡ Omnibox & Quick Bookmarks**: Enter any URL or use quick one-click bookmarks (Wikipedia, Hacker News, GitHub, localhost:3000).
- **📋 Right-Click Context Menu**: Right-click any webpage or link in Chrome and select *"📱 Test this page in Phone Simulator"*.

---

## 🚀 How to Install in Google Chrome

1. Open **Google Chrome**.
2. Navigate to `chrome://extensions/` in your address bar.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select this project directory:
   ```
   D:\KK_Repo\phone simulator
   ```
6. The **Mobile & Phone Simulator** extension is now installed and active!
7. Pin the extension to your Chrome toolbar for quick access.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Alt</kbd> + <kbd>O</kbd> | Toggle Orientation (Portrait ↔ Landscape) |
| <kbd>Alt</kbd> + <kbd>R</kbd> | Reload Viewport |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Toggle Bezel Mockup On / Off |
| <kbd>Esc</kbd> | Close open modals (QR Code / Custom Device) |

---

## 🛠️ Project Structure

```
phone simulator/
├── manifest.json       # Chrome Extension Manifest V3 configuration
├── background.js       # Background service worker (DNR header stripper & context menus)
├── devices.js          # Device presets (dimensions, DPR, user agents, frame cutouts)
├── qr.js               # Self-contained zero-dependency SVG QR Code generator
├── simulator.html      # Main simulator application layout & DOM
├── simulator.css       # Hardware chassis styles, cutouts, themes, animations
├── simulator.js        # Device rendering, zoom engine, touch tracking & events
├── icons/              # Extension icons (16px, 48px, 128px)
└── README.md           # Documentation & instructions
```

---

## 💡 Localhost Testing Tip

When testing local development servers (e.g. `http://localhost:3000` or `http://localhost:5173`):
- To test in the simulator on your PC, simply type `localhost:3000` into the URL bar.
- To test on your physical phone via the **Real Phone QR Code**, replace `localhost` with your computer's local Wi-Fi IP address (e.g. `http://192.168.1.15:3000`) and ensure both devices are on the same Wi-Fi network.
