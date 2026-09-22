// devices.js - Comprehensive Device Presets for Mobile & Phone Simulator

const DEVICE_PRESETS = [
  // --- Apple iPhones ---
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    category: 'Apple iPhone',
    width: 430,
    height: 932,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 18',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    category: 'Apple iPhone',
    width: 402,
    height: 874,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 18',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 / 14 Pro',
    category: 'Apple iPhone',
    width: 393,
    height: 852,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 17',
    default: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14 / 13 / 12',
    category: 'Apple iPhone',
    width: 390,
    height: 844,
    dpr: 3.0,
    type: 'iphone-notch',
    os: 'iOS 16',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-13-mini',
    name: 'iPhone 13 mini',
    category: 'Apple iPhone',
    width: 375,
    height: 812,
    dpr: 3.0,
    type: 'iphone-notch',
    os: 'iOS 16',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE (3rd Gen)',
    category: 'Apple iPhone',
    width: 375,
    height: 667,
    dpr: 2.0,
    type: 'iphone-classic',
    os: 'iOS 17',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },

  // --- Android Smartphones ---
  {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Android',
    width: 412,
    height: 915,
    dpr: 3.5,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-s24',
    name: 'Samsung Galaxy S24',
    category: 'Android',
    width: 360,
    height: 780,
    dpr: 3.0,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-8-pro',
    name: 'Google Pixel 8 Pro',
    category: 'Android',
    width: 412,
    height: 892,
    dpr: 3.5,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-8a',
    name: 'Google Pixel 8a',
    category: 'Android',
    width: 412,
    height: 915,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-z-fold-outer',
    name: 'Galaxy Z Fold 5 (Cover)',
    category: 'Android',
    width: 374,
    height: 892,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-z-fold-inner',
    name: 'Galaxy Z Fold 5 (Unfolded)',
    category: 'Android',
    width: 768,
    height: 960,
    dpr: 2.625,
    type: 'tablet',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },

  // --- Tablets ---
  {
    id: 'ipad-pro-129',
    name: 'iPad Pro 12.9"',
    category: 'Tablets',
    width: 1024,
    height: 1366,
    dpr: 2.0,
    type: 'tablet',
    os: 'iPadOS 17',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-air',
    name: 'iPad Air 11" (M2)',
    category: 'Tablets',
    width: 820,
    height: 1180,
    dpr: 2.0,
    type: 'tablet',
    os: 'iPadOS 17',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-mini',
    name: 'iPad mini 6',
    category: 'Tablets',
    width: 744,
    height: 1133,
    dpr: 2.0,
    type: 'tablet',
    os: 'iPadOS 17',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'galaxy-tab-s9',
    name: 'Samsung Galaxy Tab S9',
    category: 'Tablets',
    width: 800,
    height: 1280,
    dpr: 2.0,
    type: 'tablet',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEVICE_PRESETS };
}
