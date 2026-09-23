// entrypoints/background.ts - Background Service Worker for Phone Simulator

export default defineBackground(() => {
  const RULE_ID_STRIP_HEADERS = 1;

  /**
   * Configure declarativeNetRequest rules to remove X-Frame-Options
   * and Content-Security-Policy restrictions on subframes.
   * This allows the Phone Simulator iframe to display any website.
   */
  async function updateHeaderRules() {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID_STRIP_HEADERS],
        addRules: [
          {
            id: RULE_ID_STRIP_HEADERS,
            priority: 1,
            action: {
              type: 'modifyHeaders' as any,
              responseHeaders: [
                { header: 'x-frame-options', operation: 'remove' as any },
                { header: 'content-security-policy', operation: 'remove' as any },
                { header: 'frame-options', operation: 'remove' as any },
              ],
            },
            condition: {
              resourceTypes: ['sub_frame' as any],
            },
          },
        ],
      });
      console.log('[Phone Simulator] Frame header rules registered.');
    } catch (err) {
      console.error('[Phone Simulator] Failed to configure dynamic rules:', err);
    }
  }

  // On installation or extension startup
  chrome.runtime.onInstalled.addListener(() => {
    updateHeaderRules();

    // Create context menu entries
    try {
      chrome.contextMenus.create({
        id: 'open-page-simulator',
        title: '📱 Test this page in Phone Simulator',
        contexts: ['page'],
      });

      chrome.contextMenus.create({
        id: 'open-link-simulator',
        title: '📱 Open link in Phone Simulator',
        contexts: ['link'],
      });

      chrome.contextMenus.create({
        id: 'open-simulator-settings',
        title: '⚙️ Phone Simulator Settings',
        contexts: ['action'],
      });
    } catch (e) {
      console.error('[Phone Simulator] Context menu error:', e);
    }
  });

  chrome.runtime.onStartup.addListener(() => {
    updateHeaderRules();
  });

  // When user clicks the extension action icon in the toolbar
  chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
    let targetUrl = 'https://en.wikipedia.org';
    if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      targetUrl = tab.url;
    }
    const simulatorUrl = chrome.runtime.getURL(`simulator.html?url=${encodeURIComponent(targetUrl)}`);
    await chrome.tabs.create({ url: simulatorUrl });
  });

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (info.menuItemId === 'open-simulator-settings') {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      }
      return;
    }

    let targetUrl = 'https://en.wikipedia.org';
    if (info.menuItemId === 'open-link-simulator' && info.linkUrl) {
      targetUrl = info.linkUrl;
    } else if (info.pageUrl && (info.pageUrl.startsWith('http://') || info.pageUrl.startsWith('https://'))) {
      targetUrl = info.pageUrl;
    } else if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      targetUrl = tab.url;
    }
    const simulatorUrl = chrome.runtime.getURL(`simulator.html?url=${encodeURIComponent(targetUrl)}`);
    chrome.tabs.create({ url: simulatorUrl });
  });

  // Message listener for tab captures or commands
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'capture_tab') {
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        sendResponse({ dataUrl, error: chrome.runtime.lastError?.message });
      });
      return true; // Keep channel open for async response
    }

    if (message.action === 'open_devtools_window') {
      const { url, width, height, slotIndex, isDevToolsPage } = message;
      const targetUrl = isDevToolsPage
        ? chrome.runtime.getURL(`devtools.html?slot=${slotIndex || 0}`)
        : (url || 'https://en.wikipedia.org');
      const popupW = isDevToolsPage ? 980 : Math.min(1920, Math.max(320, Math.round(width || 390)));
      const popupH = isDevToolsPage ? 640 : Math.min(1200, Math.max(480, Math.round(height || 844)));
      chrome.windows.create({
        url: targetUrl,
        width: popupW,
        height: popupH,
        type: 'popup',
        focused: true
      });
      sendResponse({ success: true });
      return true;
    }
  });
});
