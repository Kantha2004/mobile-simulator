import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Mobile & Phone Simulator - Responsive Tester',
    description: 'Test websites on realistic mobile & tablet devices with interactive mockups, orientation switcher, and touch cursor.',
    permissions: [
      'declarativeNetRequest',
      'tabs',
      'activeTab',
      'storage',
      'contextMenus',
      'sidePanel',
    ],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Open Phone Simulator',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    },
    side_panel: {
      default_path: 'simulator.html',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
});
