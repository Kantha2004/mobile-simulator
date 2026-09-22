// devices.js - Comprehensive Device Presets for Mobile, Tablets, Laptops & Desktop Monitors

const DEVICE_PRESETS = [
  // =========================================================================
  // Apple iPhones
  // =========================================================================
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
    id: 'iphone-16-plus',
    name: 'iPhone 16 Plus',
    category: 'Apple iPhone',
    width: 430,
    height: 932,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 18',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    category: 'Apple iPhone',
    width: 393,
    height: 852,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 18',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    category: 'Apple iPhone',
    width: 430,
    height: 932,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 17',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
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
    id: 'iphone-15-plus',
    name: 'iPhone 15 Plus',
    category: 'Apple iPhone',
    width: 430,
    height: 932,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 17',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    category: 'Apple iPhone',
    width: 393,
    height: 852,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 17',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    category: 'Apple iPhone',
    width: 430,
    height: 932,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 16',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    category: 'Apple iPhone',
    width: 393,
    height: 852,
    dpr: 3.0,
    type: 'iphone-island',
    os: 'iOS 16',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-14-plus',
    name: 'iPhone 14 Plus',
    category: 'Apple iPhone',
    width: 428,
    height: 926,
    dpr: 3.0,
    type: 'iphone-notch',
    os: 'iOS 16',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
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
    id: 'iphone-13-pro-max',
    name: 'iPhone 13 / 12 Pro Max',
    category: 'Apple iPhone',
    width: 428,
    height: 926,
    dpr: 3.0,
    type: 'iphone-notch',
    os: 'iOS 15',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-13-mini',
    name: 'iPhone 13 mini / 12 mini',
    category: 'Apple iPhone',
    width: 375,
    height: 812,
    dpr: 3.0,
    type: 'iphone-notch',
    os: 'iOS 15',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-11-pro-max',
    name: 'iPhone 11 Pro Max / XS Max',
    category: 'Apple iPhone',
    width: 414,
    height: 896,
    dpr: 3.0,
    type: 'iphone-notch',
    os: 'iOS 14',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-11-xr',
    name: 'iPhone 11 / XR',
    category: 'Apple iPhone',
    width: 414,
    height: 896,
    dpr: 2.0,
    type: 'iphone-notch',
    os: 'iOS 14',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-x',
    name: 'iPhone X / XS / 11 Pro',
    category: 'Apple iPhone',
    width: 375,
    height: 812,
    dpr: 3.0,
    type: 'iphone-notch',
    os: 'iOS 13',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-se-3',
    name: 'iPhone SE (3rd Gen) / 8',
    category: 'Apple iPhone',
    width: 375,
    height: 667,
    dpr: 2.0,
    type: 'iphone-classic',
    os: 'iOS 17',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-8-plus',
    name: 'iPhone 8 Plus / 7 Plus',
    category: 'Apple iPhone',
    width: 414,
    height: 736,
    dpr: 3.0,
    type: 'iphone-classic',
    os: 'iOS 15',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  },

  // =========================================================================
  // Android Smartphones
  // =========================================================================
  {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Android Phones',
    width: 412,
    height: 915,
    dpr: 3.5,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-s24-plus',
    name: 'Samsung Galaxy S24+',
    category: 'Android Phones',
    width: 412,
    height: 915,
    dpr: 3.5,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S926B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-s24',
    name: 'Samsung Galaxy S24',
    category: 'Android Phones',
    width: 360,
    height: 780,
    dpr: 3.0,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-s23-ultra',
    name: 'Samsung Galaxy S23 Ultra',
    category: 'Android Phones',
    width: 412,
    height: 915,
    dpr: 3.5,
    type: 'android-punch',
    os: 'Android 13',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-s23',
    name: 'Samsung Galaxy S23 / S22',
    category: 'Android Phones',
    width: 360,
    height: 780,
    dpr: 3.0,
    type: 'android-punch',
    os: 'Android 13',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-a54',
    name: 'Samsung Galaxy A54 5G',
    category: 'Android Phones',
    width: 412,
    height: 915,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-z-fold-6-cover',
    name: 'Galaxy Z Fold 6 (Cover)',
    category: 'Android Phones',
    width: 402,
    height: 968,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F956B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-z-fold-6-inner',
    name: 'Galaxy Z Fold 6 (Inner Main)',
    category: 'Android Phones',
    width: 828,
    height: 1032,
    dpr: 2.625,
    type: 'tablet',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F956B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'galaxy-z-fold-5-cover',
    name: 'Galaxy Z Fold 5 (Cover)',
    category: 'Android Phones',
    width: 374,
    height: 892,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'galaxy-z-fold-5-inner',
    name: 'Galaxy Z Fold 5 (Inner Main)',
    category: 'Android Phones',
    width: 768,
    height: 960,
    dpr: 2.625,
    type: 'tablet',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  {
    id: 'galaxy-z-flip-6',
    name: 'Galaxy Z Flip 6 / 5',
    category: 'Android Phones',
    width: 412,
    height: 1013,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F741B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-9-pro-xl',
    name: 'Google Pixel 9 Pro XL',
    category: 'Android Phones',
    width: 412,
    height: 923,
    dpr: 3.5,
    type: 'android-punch',
    os: 'Android 15',
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-9-pro',
    name: 'Google Pixel 9 / 9 Pro',
    category: 'Android Phones',
    width: 412,
    height: 923,
    dpr: 3.0,
    type: 'android-punch',
    os: 'Android 15',
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-8-pro',
    name: 'Google Pixel 8 Pro',
    category: 'Android Phones',
    width: 412,
    height: 892,
    dpr: 3.5,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-8',
    name: 'Google Pixel 8',
    category: 'Android Phones',
    width: 412,
    height: 915,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-8a',
    name: 'Google Pixel 8a',
    category: 'Android Phones',
    width: 412,
    height: 915,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-7-pro',
    name: 'Google Pixel 7 Pro',
    category: 'Android Phones',
    width: 412,
    height: 892,
    dpr: 3.5,
    type: 'android-punch',
    os: 'Android 13',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'oneplus-12',
    name: 'OnePlus 12',
    category: 'Android Phones',
    width: 412,
    height: 919,
    dpr: 3.5,
    type: 'android-punch',
    os: 'OxygenOS 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; CPH2581) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'oneplus-open-inner',
    name: 'OnePlus Open (Inner Foldable)',
    category: 'Android Phones',
    width: 896,
    height: 984,
    dpr: 2.75,
    type: 'tablet',
    os: 'OxygenOS 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; CPH2551) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  },
  {
    id: 'xiaomi-14-pro',
    name: 'Xiaomi 14 Pro',
    category: 'Android Phones',
    width: 393,
    height: 873,
    dpr: 3.2,
    type: 'android-punch',
    os: 'HyperOS',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; 23116PN5BC) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'xiaomi-14',
    name: 'Xiaomi 14',
    category: 'Android Phones',
    width: 393,
    height: 851,
    dpr: 3.0,
    type: 'android-punch',
    os: 'HyperOS',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; 23127PN0CC) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'nothing-phone-2',
    name: 'Nothing Phone (2)',
    category: 'Android Phones',
    width: 412,
    height: 960,
    dpr: 2.625,
    type: 'android-punch',
    os: 'Nothing OS 2',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; A065) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'moto-razr-plus',
    name: 'Motorola Razr+ (2024)',
    category: 'Android Phones',
    width: 412,
    height: 1066,
    dpr: 3.0,
    type: 'android-punch',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; motorola razr 50 ultra) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
  },

  // =========================================================================
  // Tablets
  // =========================================================================
  {
    id: 'ipad-pro-13-m4',
    name: 'iPad Pro 13" (M4)',
    category: 'Tablets',
    width: 1032,
    height: 1376,
    dpr: 2.0,
    type: 'tablet',
    os: 'iPadOS 18',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-pro-129',
    name: 'iPad Pro 12.9" (M2)',
    category: 'Tablets',
    width: 1024,
    height: 1366,
    dpr: 2.0,
    type: 'tablet',
    os: 'iPadOS 17',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-pro-11-m4',
    name: 'iPad Pro 11" (M4)',
    category: 'Tablets',
    width: 834,
    height: 1210,
    dpr: 2.0,
    type: 'tablet',
    os: 'iPadOS 18',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11" (M2)',
    category: 'Tablets',
    width: 834,
    height: 1194,
    dpr: 2.0,
    type: 'tablet',
    os: 'iPadOS 17',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-air-13',
    name: 'iPad Air 13" (M2)',
    category: 'Tablets',
    width: 1024,
    height: 1366,
    dpr: 2.0,
    type: 'tablet',
    os: 'iPadOS 17',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-air-11',
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
    id: 'ipad-10th-gen',
    name: 'iPad (10th Gen)',
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
    id: 'galaxy-tab-s9-ultra',
    name: 'Samsung Galaxy Tab S9 Ultra',
    category: 'Tablets',
    width: 1120,
    height: 1792,
    dpr: 2.0,
    type: 'tablet',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
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
  },
  {
    id: 'pixel-tablet',
    name: 'Google Pixel Tablet',
    category: 'Tablets',
    width: 800,
    height: 1280,
    dpr: 2.0,
    type: 'tablet',
    os: 'Android 14',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  },
  {
    id: 'surface-pro-9',
    name: 'Microsoft Surface Pro 9',
    category: 'Tablets',
    width: 912,
    height: 1368,
    dpr: 2.0,
    type: 'tablet',
    os: 'Windows 11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },

  // =========================================================================
  // Laptops
  // =========================================================================
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13" (M2/M3)',
    category: 'Laptops',
    width: 1280,
    height: 832,
    dpr: 2.0,
    type: 'laptop',
    os: 'macOS Sequoia',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'macbook-air-15',
    name: 'MacBook Air 15" (M2/M3)',
    category: 'Laptops',
    width: 1440,
    height: 932,
    dpr: 2.0,
    type: 'laptop',
    os: 'macOS Sequoia',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'macbook-pro-14',
    name: 'MacBook Pro 14" (M3)',
    category: 'Laptops',
    width: 1512,
    height: 982,
    dpr: 2.0,
    type: 'laptop',
    os: 'macOS Sequoia',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16" (M3)',
    category: 'Laptops',
    width: 1728,
    height: 1117,
    dpr: 2.0,
    type: 'laptop',
    os: 'macOS Sequoia',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'dell-xps-13',
    name: 'Dell XPS 13 (Ultrabook)',
    category: 'Laptops',
    width: 1280,
    height: 800,
    dpr: 1.5,
    type: 'laptop',
    os: 'Windows 11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'dell-xps-15',
    name: 'Dell XPS 15 (16:10)',
    category: 'Laptops',
    width: 1536,
    height: 960,
    dpr: 1.25,
    type: 'laptop',
    os: 'Windows 11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'thinkpad-x1-carbon',
    name: 'Lenovo ThinkPad X1 Carbon',
    category: 'Laptops',
    width: 1440,
    height: 900,
    dpr: 1.5,
    type: 'laptop',
    os: 'Windows 11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'surface-laptop-5',
    name: 'Microsoft Surface Laptop 5',
    category: 'Laptops',
    width: 1504,
    height: 1002,
    dpr: 1.5,
    type: 'laptop',
    os: 'Windows 11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'generic-laptop-1366',
    name: 'Standard Laptop (1366 × 768)',
    category: 'Laptops',
    width: 1366,
    height: 768,
    dpr: 1.0,
    type: 'laptop',
    os: 'Windows 10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'chromebook-11',
    name: 'Chromebook 11"',
    category: 'Laptops',
    width: 1366,
    height: 768,
    dpr: 1.0,
    type: 'laptop',
    os: 'ChromeOS',
    userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 15393.58.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },

  // =========================================================================
  // Monitors & Desktops
  // =========================================================================
  {
    id: 'desktop-fhd-1080p',
    name: 'Desktop FHD (1080p)',
    category: 'Monitors & Desktops',
    width: 1920,
    height: 1080,
    dpr: 1.0,
    type: 'monitor',
    os: 'Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'desktop-qhd-1440p',
    name: 'Desktop 2K QHD (1440p)',
    category: 'Monitors & Desktops',
    width: 2560,
    height: 1440,
    dpr: 1.0,
    type: 'monitor',
    os: 'Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'desktop-4k-uhd',
    name: 'Desktop 4K UHD (2160p)',
    category: 'Monitors & Desktops',
    width: 3840,
    height: 2160,
    dpr: 1.5,
    type: 'monitor',
    os: 'Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'apple-studio-display',
    name: 'Apple Studio Display 27" (5K)',
    category: 'Monitors & Desktops',
    width: 2560,
    height: 1440,
    dpr: 2.0,
    type: 'monitor',
    os: 'macOS',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'apple-imac-24',
    name: 'Apple iMac 24" (4.5K)',
    category: 'Monitors & Desktops',
    width: 2240,
    height: 1260,
    dpr: 2.0,
    type: 'monitor',
    os: 'macOS',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'ultrawide-3440',
    name: 'Ultrawide 21:9 (UWQHD)',
    category: 'Monitors & Desktops',
    width: 3440,
    height: 1440,
    dpr: 1.0,
    type: 'monitor',
    os: 'Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'desktop-hd-1440',
    name: 'Desktop HD (1440 × 900)',
    category: 'Monitors & Desktops',
    width: 1440,
    height: 900,
    dpr: 1.0,
    type: 'monitor',
    os: 'Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'desktop-wxga-1280',
    name: 'Desktop WXGA (1280 × 800)',
    category: 'Monitors & Desktops',
    width: 1280,
    height: 800,
    dpr: 1.0,
    type: 'monitor',
    os: 'Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'super-ultrawide-32-9',
    name: 'Super Ultrawide 32:9 (Dual QHD)',
    category: 'Monitors & Desktops',
    width: 5120,
    height: 1440,
    dpr: 1.0,
    type: 'monitor',
    os: 'Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEVICE_PRESETS };
}
