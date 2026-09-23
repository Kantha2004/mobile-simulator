// entrypoints/devtools/main.ts - Dedicated Standalone Chrome DevTools Window
import { ChromeDevToolsUI } from '../../utils/devtools-ui';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('devtools-app-root');
  if (!root) return;

  const urlParams = new URLSearchParams(window.location.search);
  const initialSlot = parseInt(urlParams.get('slot') || '0', 10);

  const channel = new BroadcastChannel('phone_sim_devtools');
  let activeDevices: Array<{ index: number; name: string; url: string }> = [
    { index: 0, name: 'Active Device', url: 'about:blank' }
  ];

  const devToolsUI = new ChromeDevToolsUI(root, {
    isPopup: true,
    onClose: () => {
      window.close();
    },
    sendCommandToDevice: (deviceIndex: number, command: any) => {
      channel.postMessage({
        type: 'DEVTOOLS_TO_SIM_COMMAND',
        slotIndex: deviceIndex,
        command
      });
    },
    getActiveDevices: () => activeDevices
  });

  // Listen for broadcast messages from the simulator window
  channel.onmessage = (e) => {
    if (!e.data) return;
    const msg = e.data;

    if (msg.type === 'SIM_TO_DEVTOOLS_EVENT') {
      devToolsUI.handleDeviceEvent(msg.slotIndex, msg.event);
    } else if (msg.type === 'SIM_DEVICE_LIST_UPDATE') {
      activeDevices = msg.devices || [];
      devToolsUI.setActiveDevice(initialSlot < activeDevices.length ? initialSlot : 0);
    }
  };

  // Request active device list immediately
  channel.postMessage({ type: 'DEVTOOLS_READY_REQUEST_DEVICES' });
});
