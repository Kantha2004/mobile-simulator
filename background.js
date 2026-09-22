// background.js - Service Worker for Mobile & Phone Simulator Extension

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
            type: 'modifyHeaders',
            responseHeaders: [
              { header: 'x-frame-options', operation: 'remove' },
              { header: 'content-security-policy', operation: 'remove' },
              { header: 'frame-options', operation: 'remove' }
            ]
          },
          condition: {
            resourceTypes: ['sub_frame']
          }
        }
      ]
    });
    console.log('[Phone Simulator] Frame header rules registered.');
  } catch (err) {
    console.error('[Phone Simulator] Failed to configure dynamic rules:', err);
  }
}

// On installation or extension update
chrome.runtime.onInstalled.addListener(() => {
  updateHeaderRules();

  // Create context menu entries
  try {
    chrome.contextMenus.create({
      id: 'open-page-simulator',
      title: '📱 Test this page in Phone Simulator',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'open-link-simulator',
      title: '📱 Open link in Phone Simulator',
      contexts: ['link']
    });
  } catch (e) {
    console.error('[Phone Simulator] Context menu error:', e);
  }
});

chrome.runtime.onStartup.addListener(() => {
  updateHeaderRules();
});

// When user clicks the extension action icon in the toolbar
chrome.action.onClicked.addListener(async (tab) => {
  let targetUrl = 'https://en.wikipedia.org';
  if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    targetUrl = tab.url;
  }
  const simulatorUrl = chrome.runtime.getURL(`simulator.html?url=${encodeURIComponent(targetUrl)}`);
  await chrome.tabs.create({ url: simulatorUrl });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
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
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl: dataUrl, error: chrome.runtime.lastError?.message });
    });
    return true; // Keep channel open for async response
  }
});
