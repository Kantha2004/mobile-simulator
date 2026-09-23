# 📱 Mobile & Phone Simulator - WXT & Bun Extension

A modern, high-performance responsive web tester and multi-device simulator built with **[WXT](https://wxt.dev)** and **[Bun](https://bun.sh)** for Chrome (MV3) and Firefox (MV2/MV3). Test any website, web app, or `localhost` project across 73+ realistic mobile, foldable, tablet, laptop, and desktop monitor frames with multi-device side-by-side comparison, physical landscape cutout rotation, independent light/dark themes, touch cursor simulation, and QR code export.

---

## ✨ Features

- **📱 Expanded Catalog (73+ Authentic Devices)**:
  - **Apple iPhones (19)**: iPhone 16 / 15 / 14 series (Pro Max, Pro, Plus, Standard), iPhone 13 mini, SE, X/XS, 8 Plus, etc.
  - **Android Smartphones (23)**: Galaxy S24 Ultra / S23 / S22, Z Fold 6 / 5 (Cover & Inner screens), Z Flip 6 / 5, OnePlus Open, Google Pixel 9 / 8 / 7 series, Xiaomi 14, Nothing Phone (2).
  - **Tablets (12)**: iPad Pro 13" M4, 12.9" M2, 11" M4, iPad Air 13" / 11", iPad 10th Gen, iPad mini 6, Galaxy Tab S9 Ultra, Surface Pro 9.
  - **Laptops (10)**: MacBook Air 13" / 15", MacBook Pro 14" / 16", Dell XPS 13 / 15, ThinkPad X1, Surface Laptop 5, Chromebook (with hinge recesses, webcams, and macOS window traffic lights).
  - **Monitors & Desktops (9)**: FHD 1080p, 2K QHD, 4K UHD, Studio Display 5K, iMac 24" 4.5K, Ultrawide 21:9 UWQHD, Super Ultrawide 32:9 (with realistic weighted stands).
  - **Custom Devices**: Configure any custom width, height, DPR, and chassis format.
- **🔄 Realistic Landscape Hardware Cutouts**:
  - Rotating to landscape preserves physical short-edge placement: the Dynamic Island, notch, or punch-hole dynamically aligns to the **left edge** as a vertical pill with safe-area padding (`padding-left: 44px`), preventing overlaps with status bar clocks or address bars.
- **🌓 Independent Per-Device Light & Dark Themes**:
  - Test light and dark versions side-by-side simultaneously.
  - Each device slot independently toggles between Light Mode and Dark Mode, harmonizing browser chrome, status bar, titanium chassis finishes, and iframe color schemes (`color-scheme: light | dark`).
- **🎨 6 Luxury Chassis Finishes**:
  - Space Black, Silver Titanium, Natural Titanium, Desert Gold, Midnight Navy, and Ceramic White.
- **⚡ Multi-Device Side-by-Side Canvas**:
  - Add multiple devices simultaneously using the `+` button. Compare viewports, DPR scaling, and responsive breakpoints at a glance.
- **👆 Mobile Touch & Drag Emulation**:
  - Touch ball pointer, ripple effects, inertial momentum dragging, and zero-width scrollbars.
- **🔓 Seamless Site Embedding**:
  - Built-in `declarativeNetRequest` engine strips `X-Frame-Options` and `Content-Security-Policy: frame-ancestors` on subframes, allowing almost any public website or local dev server to load.
- **📸 1-Click Screenshot & Real Phone QR Code**:
  - Capture viewport snapshots or scan the offline QR code to test on your physical phone instantly.
- **🛠️ Per-Device DevTools (In-Frame & Native Chrome DevTools)**:
  - **In-Device Mobile DevTools (`</>`)**: 1-click toggle to open full in-frame developer tools (Console, DOM Elements tree, Network inspector, Storage/Cookies, Resources, and Info) right inside that specific device screen.
  - **Inspect in External Native DevTools Window**: Opens the device in a dedicated popup window sized to the device's exact dimensions and DPR, with instant access to Chrome's native DevTools (`F12` / `Ctrl+Shift+I`).
- **⚙️ Full Settings Dashboard (Options Page)**:
  - Accessible via the topbar gear icon, extension options, or right-click context menu.
  - Customize default startup device, initial orientation, default zoom scale, view mode, chassis finish, browser color scheme, touch pointer behavior, and startup homepage URL.
  - Manage custom viewport presets with instant sync across sessions.

---

## 🚀 Development & Build with Bun

This project is built using **[Bun](https://bun.sh)** and **[WXT](https://wxt.dev)**.

### Prerequisites
- [Bun](https://bun.sh) (v1.1+)

### Commands

| Command | Description |
| :--- | :--- |
| `bun install` | Install project dependencies |
| `bun run dev` | Start WXT dev server with hot module reload |
| `bun run dev:firefox` | Start WXT dev server targeting Firefox |
| `bun run build` | Build Chrome MV3 production extension to `.output/chrome-mv3` |
| `bun run build:firefox` | Build Firefox extension to `.output/firefox-mv2` |
| `bun run zip` | Package Chrome extension into `.output/phone-simulator-1.0.0-chrome.zip` |
| `bun run compile` | Run TypeScript type checks (`tsc --noEmit`) |

---

## 📦 How to Install in Google Chrome / Edge

1. Build the production extension:
   ```powershell
   bun run build
   ```
2. Open **Google Chrome** or **Microsoft Edge**.
3. Navigate to `chrome://extensions/` (or `edge://extensions/`).
4. Enable **Developer mode** toggle in the top-right corner.
5. Click **Load unpacked**.
6. Select the compiled output directory:
   ```
   D:\KK_Repo\phone simulator\.output\chrome-mv3
   ```
7. The extension is now active! Pin it to your toolbar for quick access.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Alt</kbd> + <kbd>O</kbd> | Toggle Orientation (Portrait ↔ Landscape) |
| <kbd>Alt</kbd> + <kbd>R</kbd> | Reload Viewport |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Toggle Bezel Mockup On / Off |
| <kbd>Esc</kbd> | Close open modals (QR Code / Custom Device / Add Device) |

---

## 🛠️ Project Structure (WXT Architecture)

```
phone simulator/
├── entrypoints/
│   ├── background.ts             # Service worker (DNR header rules & context menus)
│   ├── touch.content.ts          # Content script (touch emulation, drag momentum, color-scheme)
│   ├── simulator.html            # Main simulator app shell
│   ├── simulator/
│   │   ├── main.ts               # Canvas engine, multi-device management, event listeners
│   │   └── style.css             # Hardware chassis, cutouts, status bars, luxury finishes
│   ├── options.html              # Full Settings Dashboard app shell
│   └── options/
│       ├── main.ts               # Settings manager, preset editor, storage sync
│       └── style.css             # Polished settings dashboard styles
├── utils/
│   ├── devices.ts                # 73+ typed device presets & dimension calculators
│   ├── qr.ts                     # Zero-dependency SVG QR code generator
│   └── settings.ts               # Centralized settings storage & sync
├── public/
│   └── icons/                    # Extension action icons (16px, 48px, 128px)
├── .output/                      # Compiled extensions (chrome-mv3, firefox-mv2, zip packages)
├── wxt.config.ts                 # WXT build configuration & manifest options
├── package.json                  # Bun scripts & dependencies
└── tsconfig.json                 # TypeScript configuration
```

---

## 💡 Localhost Testing Tip

When testing local development servers (e.g. `http://localhost:3000` or `http://localhost:5173`):
- To test in the simulator on your PC, simply type `localhost:3000` into the URL bar.
- To test on your physical phone via the **Real Phone QR Code**, replace `localhost` with your computer's local Wi-Fi IP address (e.g. `http://192.168.1.15:3000`) and ensure both devices are on the same Wi-Fi network.
