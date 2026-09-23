// utils/devtools-ui.ts - Reusable Chrome DevTools Interface Component
// Provides pixel-accurate Google Chrome DevTools UI: Elements, Styles & Box Model, Console, Network, Application/Storage, Device Metrics

export interface DevToolsOptions {
  isPopup?: boolean;
  onUndock?: () => void;
  onDockBottom?: () => void;
  onDockRight?: () => void;
  onClose?: () => void;
  sendCommandToDevice: (deviceIndex: number, command: any) => void;
  getActiveDevices: () => Array<{ index: number; name: string; url: string }>;
}

export interface NetworkItem {
  id: string;
  url: string;
  name: string;
  method: string;
  status: number;
  statusText: string;
  type: string;
  size: string;
  duration: number;
  startTime: number;
  headers: Record<string, string>;
  responseBody?: string;
}

export interface ConsoleItem {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  text: string;
  time: string;
  args?: any[];
  count: number;
}

export interface BoxModelData {
  margin: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
  content: { width: number; height: number };
}

export class ChromeDevToolsUI {
  private container: HTMLElement;
  private options: DevToolsOptions;
  private activeDeviceIndex: number = 0;
  private activeTab: 'elements' | 'console' | 'network' | 'application' | 'info' = 'elements';

  // State per device
  private consoleLogs: Map<number, ConsoleItem[]> = new Map();
  private networkRequests: Map<number, NetworkItem[]> = new Map();
  private domTree: Map<number, any> = new Map();
  private selectedNodePath: string | null = null;
  private selectedNodeStyles: Record<string, string> | null = null;
  private selectedNodeBoxModel: BoxModelData | null = null;
  private selectedNetworkItem: NetworkItem | null = null;
  private networkDetailsTab: 'headers' | 'preview' | 'response' = 'headers';

  // Filters
  private consoleFilterText: string = '';
  private consoleLevelFilter: 'all' | 'error' | 'warn' | 'info' = 'all';
  private networkFilterText: string = '';
  private networkTypeFilter: 'all' | 'fetch' | 'js' | 'css' | 'img' | 'doc' = 'all';
  private stylesFilterText: string = '';

  // Inspect element mode
  private isInspectModeActive: boolean = false;

  // Command history
  private cmdHistory: string[] = [];
  private cmdHistoryIndex: number = -1;

  constructor(container: HTMLElement, options: DevToolsOptions) {
    this.container = container;
    this.options = options;
    this.renderSkeleton();
    this.bindEvents();
    this.refreshDeviceSelect();
  }

  public setActiveDevice(index: number) {
    this.activeDeviceIndex = index;
    this.refreshDeviceSelect();
    this.requestDeviceState();
    this.renderCurrentTab();
  }

  public handleDeviceEvent(deviceIndex: number, event: any) {
    if (!event) return;

    if (event.subType === 'CONSOLE') {
      const logs = this.consoleLogs.get(deviceIndex) || [];
      const item: ConsoleItem = {
        id: 'log_' + Math.random().toString(36).slice(2),
        type: event.payload.type || 'log',
        text: event.payload.text || '',
        time: event.payload.time || new Date().toLocaleTimeString(),
        args: event.payload.args,
        count: 1
      };

      // Deduplicate consecutive identical logs
      const last = logs[logs.length - 1];
      if (last && last.text === item.text && last.type === item.type) {
        last.count += 1;
        last.time = item.time;
      } else {
        logs.push(item);
        if (logs.length > 500) logs.shift();
      }
      this.consoleLogs.set(deviceIndex, logs);

      this.updateBadges();
      if (this.activeDeviceIndex === deviceIndex && this.activeTab === 'console') {
        this.renderConsole();
      }
    } else if (event.subType === 'NETWORK_START') {
      const reqs = this.networkRequests.get(deviceIndex) || [];
      const payload = event.payload;
      const urlObj = safeParseUrl(payload.url);
      const name = urlObj ? (urlObj.pathname.split('/').filter(Boolean).pop() || urlObj.host) : payload.url;

      const item: NetworkItem = {
        id: payload.id,
        url: payload.url,
        name: name || 'request',
        method: payload.method || 'GET',
        status: 0,
        statusText: '(pending)',
        type: 'pending',
        size: '-',
        duration: 0,
        startTime: payload.startTime || Date.now(),
        headers: {}
      };
      reqs.push(item);
      if (reqs.length > 300) reqs.shift();
      this.networkRequests.set(deviceIndex, reqs);

      this.updateBadges();
      if (this.activeDeviceIndex === deviceIndex && this.activeTab === 'network') {
        this.renderNetwork();
      }
    } else if (event.subType === 'NETWORK_END') {
      const reqs = this.networkRequests.get(deviceIndex) || [];
      const payload = event.payload;
      const target = reqs.find(r => r.id === payload.id);
      if (target) {
        target.status = payload.status;
        target.statusText = payload.statusText;
        target.duration = payload.duration;
        target.type = cleanMimeType(payload.type);
        target.headers = payload.headers || {};
        target.responseBody = payload.responseBody;
        target.size = formatBytes(payload.responseBody ? payload.responseBody.length : 0);
      }
      this.updateBadges();
      if (this.activeDeviceIndex === deviceIndex && this.activeTab === 'network') {
        this.renderNetwork();
      }
    } else if (event.subType === 'DOM_RESPONSE') {
      this.domTree.set(deviceIndex, event.payload);
      if (this.activeDeviceIndex === deviceIndex && this.activeTab === 'elements') {
        this.renderElements();
      }
    } else if (event.subType === 'STYLES_RESPONSE') {
      if (this.activeDeviceIndex === deviceIndex) {
        this.selectedNodeStyles = event.payload.styles;
        this.selectedNodeBoxModel = event.payload.boxModel;
        this.renderStylesPane();
      }
    } else if (event.subType === 'INSPECT_ELEMENT_CLICKED') {
      if (this.activeDeviceIndex === deviceIndex) {
        this.selectedNodePath = event.payload.path;
        this.selectedNodeStyles = event.payload.styles;
        this.selectedNodeBoxModel = event.payload.boxModel;
        this.activeTab = 'elements';
        this.updateTabButtons();
        this.renderElements();
        this.renderStylesPane();
      }
    } else if (event.subType === 'STORAGE_RESPONSE') {
      if (this.activeDeviceIndex === deviceIndex && this.activeTab === 'application') {
        this.renderApplication(event.payload);
      }
    }
  }

  private requestDeviceState() {
    this.options.sendCommandToDevice(this.activeDeviceIndex, { action: 'get_dom' });
    if (this.activeTab === 'application') {
      this.options.sendCommandToDevice(this.activeDeviceIndex, { action: 'get_storage' });
    }
  }

  private renderSkeleton() {
    this.container.innerHTML = `
      <div class="cdt-root">
        <!-- Top Toolbar -->
        <div class="cdt-toolbar">
          <div class="cdt-toolbar-left">
            <button class="cdt-tool-btn cdt-btn-inspect" title="Select an element in the page to inspect it">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3l7 14 3-5 5-3-15-6z"/>
              </svg>
            </button>

            <!-- Device Selector Dropdown -->
            <div class="cdt-device-selector-wrapper">
              <span class="cdt-device-icon">📱</span>
              <select class="cdt-device-select"></select>
            </div>

            <!-- Tab Buttons -->
            <div class="cdt-tabs">
              <button class="cdt-tab active" data-tab="elements">Elements</button>
              <button class="cdt-tab" data-tab="console">
                Console
                <span class="cdt-badge cdt-badge-error" style="display:none;">0</span>
                <span class="cdt-badge cdt-badge-warn" style="display:none;">0</span>
              </button>
              <button class="cdt-tab" data-tab="network">
                Network
                <span class="cdt-badge cdt-badge-reqs" style="display:none;">0</span>
              </button>
              <button class="cdt-tab" data-tab="application">Application</button>
              <button class="cdt-tab" data-tab="info">Device Metrics</button>
            </div>
          </div>

          <div class="cdt-toolbar-right">
            <button class="cdt-tool-btn cdt-btn-clear" title="Clear current panel">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </button>

            ${!this.options.isPopup ? `
              <button class="cdt-tool-btn cdt-btn-undock" title="Open DevTools in separate popup window">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
            ` : ''}

            ${this.options.onClose ? `
              <button class="cdt-tool-btn cdt-btn-close" title="Close DevTools">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Filter Sub-Bar (dynamic per tab) -->
        <div class="cdt-filter-bar">
          <!-- Dynamic filter inputs inserted here -->
        </div>

        <!-- Panels Container -->
        <div class="cdt-panels-viewport">
          <div class="cdt-panel cdt-panel-elements active">
            <div class="cdt-elements-split">
              <div class="cdt-dom-tree-pane">
                <div class="cdt-dom-tree-content"></div>
              </div>
              <div class="cdt-styles-pane">
                <!-- Box Model & Styles -->
              </div>
            </div>
          </div>

          <div class="cdt-panel cdt-panel-console">
            <div class="cdt-console-output"></div>
            <div class="cdt-console-prompt">
              <span class="cdt-prompt-arrow">&gt;</span>
              <input type="text" class="cdt-console-input" placeholder="Type JavaScript expression and press Enter..." spellcheck="false" />
            </div>
          </div>

          <div class="cdt-panel cdt-panel-network">
            <div class="cdt-network-split">
              <div class="cdt-network-table-container">
                <table class="cdt-network-table">
                  <thead>
                    <tr>
                      <th style="width:25%;">Name</th>
                      <th style="width:12%;">Status</th>
                      <th style="width:10%;">Method</th>
                      <th style="width:15%;">Type</th>
                      <th style="width:12%;">Size</th>
                      <th style="width:12%;">Time</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
              <div class="cdt-network-details-pane" style="display:none;">
                <!-- Detailed headers / response payload -->
              </div>
            </div>
          </div>

          <div class="cdt-panel cdt-panel-application">
            <div class="cdt-app-split">
              <div class="cdt-app-sidebar">
                <div class="cdt-app-tree-item active" data-app-type="local">
                  <span class="cdt-tree-icon">🗄️</span> Local Storage
                </div>
                <div class="cdt-app-tree-item" data-app-type="session">
                  <span class="cdt-tree-icon">⏳</span> Session Storage
                </div>
                <div class="cdt-app-tree-item" data-app-type="cookies">
                  <span class="cdt-tree-icon">🍪</span> Cookies
                </div>
              </div>
              <div class="cdt-app-content">
                <div class="cdt-app-actions">
                  <button class="cdt-mini-btn cdt-app-btn-refresh">Refresh</button>
                  <button class="cdt-mini-btn cdt-app-btn-clear">Clear All</button>
                </div>
                <div class="cdt-app-table-wrapper">
                  <table class="cdt-app-table">
                    <thead><tr><th style="width:35%;">Key</th><th>Value</th></tr></thead>
                    <tbody></tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="cdt-panel cdt-panel-info">
            <div class="cdt-info-content"></div>
          </div>
        </div>
      </div>
    `;

    this.renderFilterBar();
    this.renderStylesPane();
  }

  private refreshDeviceSelect() {
    const select = this.container.querySelector<HTMLSelectElement>('.cdt-device-select');
    if (!select) return;

    const devices = this.options.getActiveDevices();
    select.innerHTML = devices.map(d => `
      <option value="${d.index}" ${d.index === this.activeDeviceIndex ? 'selected' : ''}>
        Slot ${d.index + 1}: ${escapeHtml(d.name)}
      </option>
    `).join('');
  }

  private bindEvents() {
    // Device switch
    const deviceSelect = this.container.querySelector<HTMLSelectElement>('.cdt-device-select');
    deviceSelect?.addEventListener('change', () => {
      this.setActiveDevice(parseInt(deviceSelect.value, 10));
    });

    // Tab buttons
    const tabBtns = this.container.querySelectorAll<HTMLButtonElement>('.cdt-tab');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = (btn.getAttribute('data-tab') as any) || 'elements';
        this.updateTabButtons();
        this.renderFilterBar();
        this.renderCurrentTab();
      });
    });

    // Inspect mode button
    const inspectBtn = this.container.querySelector<HTMLButtonElement>('.cdt-btn-inspect');
    inspectBtn?.addEventListener('click', () => {
      this.isInspectModeActive = !this.isInspectModeActive;
      inspectBtn.classList.toggle('active', this.isInspectModeActive);
      this.options.sendCommandToDevice(this.activeDeviceIndex, {
        action: 'set_inspect_mode',
        enabled: this.isInspectModeActive
      });
    });

    // Clear button
    const clearBtn = this.container.querySelector<HTMLButtonElement>('.cdt-btn-clear');
    clearBtn?.addEventListener('click', () => {
      if (this.activeTab === 'console') {
        this.consoleLogs.set(this.activeDeviceIndex, []);
        this.renderConsole();
        this.updateBadges();
      } else if (this.activeTab === 'network') {
        this.networkRequests.set(this.activeDeviceIndex, []);
        this.renderNetwork();
        this.updateBadges();
      }
    });

    // Undock / Popout button
    const undockBtn = this.container.querySelector<HTMLButtonElement>('.cdt-btn-undock');
    undockBtn?.addEventListener('click', () => {
      this.options.onUndock?.();
    });

    // Close button
    const closeBtn = this.container.querySelector<HTMLButtonElement>('.cdt-btn-close');
    closeBtn?.addEventListener('click', () => {
      this.options.onClose?.();
    });

    // Console Command Input
    const cmdInput = this.container.querySelector<HTMLInputElement>('.cdt-console-input');
    cmdInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = cmdInput.value.trim();
        if (!cmd) return;
        this.cmdHistory.push(cmd);
        this.cmdHistoryIndex = this.cmdHistory.length;
        cmdInput.value = '';

        // Add user command to console
        const logs = this.consoleLogs.get(this.activeDeviceIndex) || [];
        logs.push({
          id: 'eval_req_' + Math.random().toString(36).slice(2),
          type: 'info',
          text: `> ${cmd}`,
          time: new Date().toLocaleTimeString(),
          count: 1
        });
        this.consoleLogs.set(this.activeDeviceIndex, logs);
        this.renderConsole();

        // Send to iframe for evaluation
        this.options.sendCommandToDevice(this.activeDeviceIndex, {
          action: 'eval',
          code: cmd
        });
      } else if (e.key === 'ArrowUp') {
        if (this.cmdHistoryIndex > 0) {
          this.cmdHistoryIndex--;
          cmdInput.value = this.cmdHistory[this.cmdHistoryIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        if (this.cmdHistoryIndex < this.cmdHistory.length - 1) {
          this.cmdHistoryIndex++;
          cmdInput.value = this.cmdHistory[this.cmdHistoryIndex] || '';
        } else {
          this.cmdHistoryIndex = this.cmdHistory.length;
          cmdInput.value = '';
        }
      }
    });

    // Application Storage Tree Buttons
    const appTreeItems = this.container.querySelectorAll<HTMLElement>('.cdt-app-tree-item');
    appTreeItems.forEach(item => {
      item.addEventListener('click', () => {
        appTreeItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.options.sendCommandToDevice(this.activeDeviceIndex, { action: 'get_storage' });
      });
    });

    const appRefresh = this.container.querySelector<HTMLButtonElement>('.cdt-app-btn-refresh');
    appRefresh?.addEventListener('click', () => {
      this.options.sendCommandToDevice(this.activeDeviceIndex, { action: 'get_storage' });
    });

    const appClear = this.container.querySelector<HTMLButtonElement>('.cdt-app-btn-clear');
    appClear?.addEventListener('click', () => {
      const activeType = this.container.querySelector('.cdt-app-tree-item.active')?.getAttribute('data-app-type') || 'local';
      this.options.sendCommandToDevice(this.activeDeviceIndex, {
        action: 'clear_storage',
        storageType: activeType
      });
    });
  }

  private updateTabButtons() {
    const tabBtns = this.container.querySelectorAll<HTMLButtonElement>('.cdt-tab');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === this.activeTab);
    });

    const panels = this.container.querySelectorAll<HTMLElement>('.cdt-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.classList.contains(`cdt-panel-${this.activeTab}`));
    });
  }

  private renderFilterBar() {
    const bar = this.container.querySelector<HTMLElement>('.cdt-filter-bar');
    if (!bar) return;

    if (this.activeTab === 'console') {
      bar.style.display = 'flex';
      bar.innerHTML = `
        <div class="cdt-filter-group">
          <input type="text" class="cdt-filter-input cdt-console-filter" placeholder="Filter console (e.g. error, warn)..." value="${escapeHtml(this.consoleFilterText)}" />
        </div>
        <div class="cdt-filter-pills">
          <button class="cdt-pill ${this.consoleLevelFilter === 'all' ? 'active' : ''}" data-level="all">All</button>
          <button class="cdt-pill cdt-pill-err ${this.consoleLevelFilter === 'error' ? 'active' : ''}" data-level="error">Errors</button>
          <button class="cdt-pill cdt-pill-warn ${this.consoleLevelFilter === 'warn' ? 'active' : ''}" data-level="warn">Warnings</button>
          <button class="cdt-pill cdt-pill-info ${this.consoleLevelFilter === 'info' ? 'active' : ''}" data-level="info">Info</button>
        </div>
      `;

      const input = bar.querySelector<HTMLInputElement>('.cdt-console-filter');
      input?.addEventListener('input', () => {
        this.consoleFilterText = input.value.trim().toLowerCase();
        this.renderConsole();
      });

      const pills = bar.querySelectorAll<HTMLButtonElement>('.cdt-pill');
      pills.forEach(p => {
        p.addEventListener('click', () => {
          this.consoleLevelFilter = (p.getAttribute('data-level') as any) || 'all';
          pills.forEach(x => x.classList.toggle('active', x === p));
          this.renderConsole();
        });
      });
    } else if (this.activeTab === 'network') {
      bar.style.display = 'flex';
      bar.innerHTML = `
        <div class="cdt-filter-group">
          <input type="text" class="cdt-filter-input cdt-network-filter" placeholder="Filter requests (e.g. api, .json)..." value="${escapeHtml(this.networkFilterText)}" />
        </div>
        <div class="cdt-filter-pills">
          <button class="cdt-pill ${this.networkTypeFilter === 'all' ? 'active' : ''}" data-ntype="all">All</button>
          <button class="cdt-pill ${this.networkTypeFilter === 'fetch' ? 'active' : ''}" data-ntype="fetch">Fetch/XHR</button>
          <button class="cdt-pill ${this.networkTypeFilter === 'js' ? 'active' : ''}" data-ntype="js">JS</button>
          <button class="cdt-pill ${this.networkTypeFilter === 'css' ? 'active' : ''}" data-ntype="css">CSS</button>
          <button class="cdt-pill ${this.networkTypeFilter === 'img' ? 'active' : ''}" data-ntype="img">Img</button>
          <button class="cdt-pill ${this.networkTypeFilter === 'doc' ? 'active' : ''}" data-ntype="doc">Doc</button>
        </div>
      `;

      const input = bar.querySelector<HTMLInputElement>('.cdt-network-filter');
      input?.addEventListener('input', () => {
        this.networkFilterText = input.value.trim().toLowerCase();
        this.renderNetwork();
      });

      const pills = bar.querySelectorAll<HTMLButtonElement>('.cdt-pill');
      pills.forEach(p => {
        p.addEventListener('click', () => {
          this.networkTypeFilter = (p.getAttribute('data-ntype') as any) || 'all';
          pills.forEach(x => x.classList.toggle('active', x === p));
          this.renderNetwork();
        });
      });
    } else {
      bar.style.display = 'none';
      bar.innerHTML = '';
    }
  }

  private updateBadges() {
    const logs = this.consoleLogs.get(this.activeDeviceIndex) || [];
    const errors = logs.filter(l => l.type === 'error').length;
    const warns = logs.filter(l => l.type === 'warn').length;

    const errBadge = this.container.querySelector<HTMLElement>('.cdt-badge-error');
    if (errBadge) {
      errBadge.style.display = errors > 0 ? 'inline-block' : 'none';
      errBadge.textContent = String(errors);
    }

    const warnBadge = this.container.querySelector<HTMLElement>('.cdt-badge-warn');
    if (warnBadge) {
      warnBadge.style.display = warns > 0 ? 'inline-block' : 'none';
      warnBadge.textContent = String(warns);
    }

    const reqs = this.networkRequests.get(this.activeDeviceIndex) || [];
    const reqBadge = this.container.querySelector<HTMLElement>('.cdt-badge-reqs');
    if (reqBadge) {
      reqBadge.style.display = reqs.length > 0 ? 'inline-block' : 'none';
      reqBadge.textContent = String(reqs.length);
    }
  }

  private renderCurrentTab() {
    if (this.activeTab === 'elements') this.renderElements();
    else if (this.activeTab === 'console') this.renderConsole();
    else if (this.activeTab === 'network') this.renderNetwork();
    else if (this.activeTab === 'application') this.requestDeviceState();
    else if (this.activeTab === 'info') this.renderInfo();
  }

  // --- Elements Panel Rendering ---
  private renderElements() {
    const pane = this.container.querySelector<HTMLElement>('.cdt-dom-tree-content');
    if (!pane) return;

    const dom = this.domTree.get(this.activeDeviceIndex);
    if (!dom) {
      pane.innerHTML = `
        <div class="cdt-empty-state">
          Loading DOM tree...
          <button class="cdt-mini-btn" style="margin-top:6px;" id="cdt-btn-refresh-dom">Refresh DOM</button>
        </div>
      `;
      pane.querySelector('#cdt-btn-refresh-dom')?.addEventListener('click', () => {
        this.options.sendCommandToDevice(this.activeDeviceIndex, { action: 'get_dom' });
      });
      return;
    }

    pane.innerHTML = this.renderDomNodeHtml(dom, '0');
    this.bindDomTreeEvents(pane);
  }

  private renderDomNodeHtml(node: any, path: string): string {
    if (!node) return '';

    if (node.type === 'text') {
      return `<div class="cdt-dom-line cdt-dom-text">${escapeHtml(node.text)}</div>`;
    }

    const tag = node.tagName || 'div';
    const idStr = node.id ? `<span class="cdt-attr-id">#${escapeHtml(node.id)}</span>` : '';
    const classStr = node.className ? `<span class="cdt-attr-class">.${escapeHtml(String(node.className).trim().replace(/\s+/g, '.'))}</span>` : '';

    const attrs = Object.entries(node.attributes || {})
      .filter(([k]) => k !== 'id' && k !== 'class')
      .slice(0, 4)
      .map(([k, v]) => ` <span class="cdt-attr-name">${escapeHtml(k)}</span>="<span class="cdt-attr-val">${escapeHtml(String(v))}</span>"`)
      .join('');

    const hasChildren = node.children && node.children.length > 0;
    const isSelected = this.selectedNodePath === path;

    let html = `
      <div class="cdt-dom-node ${isSelected ? 'selected' : ''}" data-path="${path}">
        <div class="cdt-dom-line">
          ${hasChildren ? '<span class="cdt-dom-toggle">▼</span>' : '<span class="cdt-dom-spacer"></span>'}
          <span class="cdt-tag-bracket">&lt;</span><span class="cdt-tag-name">${tag}</span>${idStr}${classStr}${attrs}<span class="cdt-tag-bracket">&gt;</span>
        </div>
    `;

    if (hasChildren) {
      html += `<div class="cdt-dom-children">`;
      node.children.forEach((child: any, idx: number) => {
        html += this.renderDomNodeHtml(child, `${path}_${idx}`);
      });
      html += `</div>`;
      html += `
        <div class="cdt-dom-line cdt-dom-closing">
          <span class="cdt-dom-spacer"></span>
          <span class="cdt-tag-bracket">&lt;/</span><span class="cdt-tag-name">${tag}</span><span class="cdt-tag-bracket">&gt;</span>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  private bindDomTreeEvents(pane: HTMLElement) {
    // Hover element highlight
    const nodes = pane.querySelectorAll<HTMLElement>('.cdt-dom-node');
    nodes.forEach(node => {
      node.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        const path = node.getAttribute('data-path');
        if (path) {
          this.options.sendCommandToDevice(this.activeDeviceIndex, {
            action: 'hover_node',
            path
          });
        }
      });

      node.addEventListener('mouseleave', () => {
        this.options.sendCommandToDevice(this.activeDeviceIndex, {
          action: 'clear_highlight'
        });
      });

      // Click to select
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        nodes.forEach(n => n.classList.remove('selected'));
        node.classList.add('selected');
        const path = node.getAttribute('data-path');
        if (path) {
          this.selectedNodePath = path;
          this.options.sendCommandToDevice(this.activeDeviceIndex, {
            action: 'get_styles',
            path
          });
        }
      });
    });

    // Expand/collapse toggles
    const toggles = pane.querySelectorAll<HTMLElement>('.cdt-dom-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = toggle.closest('.cdt-dom-node');
        const children = parent?.querySelector<HTMLElement>(':scope > .cdt-dom-children');
        const closing = parent?.querySelector<HTMLElement>(':scope > .cdt-dom-closing');
        if (children) {
          const isHidden = children.style.display === 'none';
          children.style.display = isHidden ? 'block' : 'none';
          if (closing) closing.style.display = isHidden ? 'block' : 'none';
          toggle.textContent = isHidden ? '▼' : '▶';
        }
      });
    });
  }

  private renderStylesPane() {
    const pane = this.container.querySelector<HTMLElement>('.cdt-styles-pane');
    if (!pane) return;

    const bm = this.selectedNodeBoxModel || {
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      border: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      content: { width: 320, height: 100 }
    };

    pane.innerHTML = `
      <div class="cdt-styles-header">Styles & Box Model</div>
      
      <!-- Interactive Chrome DevTools Box Model -->
      <div class="cdt-box-model-container">
        <div class="cdt-bm-margin">
          <span class="cdt-bm-label">margin</span>
          <span class="cdt-bm-top">${bm.margin.top}</span>
          <span class="cdt-bm-left">${bm.margin.left}</span>
          <span class="cdt-bm-right">${bm.margin.right}</span>
          <span class="cdt-bm-bottom">${bm.margin.bottom}</span>

          <div class="cdt-bm-border">
            <span class="cdt-bm-label">border</span>
            <span class="cdt-bm-top">${bm.border.top}</span>
            <span class="cdt-bm-left">${bm.border.left}</span>
            <span class="cdt-bm-right">${bm.border.right}</span>
            <span class="cdt-bm-bottom">${bm.border.bottom}</span>

            <div class="cdt-bm-padding">
              <span class="cdt-bm-label">padding</span>
              <span class="cdt-bm-top">${bm.padding.top}</span>
              <span class="cdt-bm-left">${bm.padding.left}</span>
              <span class="cdt-bm-right">${bm.padding.right}</span>
              <span class="cdt-bm-bottom">${bm.padding.bottom}</span>

              <div class="cdt-bm-content">
                <span>${Math.round(bm.content.width)} × ${Math.round(bm.content.height)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Computed CSS Styles Rules -->
      <div class="cdt-computed-styles-wrapper">
        <div class="cdt-styles-search-bar">
          <input type="text" class="cdt-styles-search" placeholder="Filter styles..." value="${escapeHtml(this.stylesFilterText)}" />
        </div>
        <div class="cdt-computed-list">
          ${this.renderComputedStylesList()}
        </div>
      </div>
    `;

    const searchInput = pane.querySelector<HTMLInputElement>('.cdt-styles-search');
    searchInput?.addEventListener('input', () => {
      this.stylesFilterText = searchInput.value.trim().toLowerCase();
      const list = pane.querySelector<HTMLElement>('.cdt-computed-list');
      if (list) list.innerHTML = this.renderComputedStylesList();
    });
  }

  private renderComputedStylesList(): string {
    if (!this.selectedNodeStyles) {
      return '<div class="cdt-empty-state">Select an element to view computed CSS styles.</div>';
    }

    const entries = Object.entries(this.selectedNodeStyles)
      .filter(([k]) => !this.stylesFilterText || k.toLowerCase().includes(this.stylesFilterText));

    if (entries.length === 0) {
      return '<div class="cdt-empty-state">No matching CSS rules.</div>';
    }

    return entries.map(([prop, val]) => `
      <div class="cdt-style-row">
        <span class="cdt-style-prop">${escapeHtml(prop)}:</span>
        <span class="cdt-style-val">${escapeHtml(val)};</span>
      </div>
    `).join('');
  }

  // --- Console Panel Rendering ---
  private renderConsole() {
    const output = this.container.querySelector<HTMLElement>('.cdt-console-output');
    if (!output) return;

    const allLogs = this.consoleLogs.get(this.activeDeviceIndex) || [];
    const filtered = allLogs.filter(l => {
      if (this.consoleLevelFilter !== 'all' && l.type !== this.consoleLevelFilter) return false;
      if (this.consoleFilterText && !l.text.toLowerCase().includes(this.consoleFilterText)) return false;
      return true;
    });

    if (filtered.length === 0) {
      output.innerHTML = '<div class="cdt-empty-state">Console is empty. Type an expression below to evaluate.</div>';
      return;
    }

    output.innerHTML = filtered.map(log => {
      const typeClass = `cdt-log-${log.type}`;
      const icon = log.type === 'error' ? '✕' : log.type === 'warn' ? '⚠' : log.type === 'info' ? 'ℹ' : '';
      const countBadge = log.count > 1 ? `<span class="cdt-log-repeat-badge">${log.count}</span>` : '';

      return `
        <div class="cdt-console-row ${typeClass}">
          <span class="cdt-log-time">${log.time}</span>
          ${icon ? `<span class="cdt-log-icon">${icon}</span>` : ''}
          <span class="cdt-log-text">${escapeHtml(log.text)}</span>
          ${countBadge}
        </div>
      `;
    }).join('');

    output.scrollTop = output.scrollHeight;
  }

  // --- Network Panel Rendering ---
  private renderNetwork() {
    const tbody = this.container.querySelector<HTMLTableSectionElement>('.cdt-network-table tbody');
    if (!tbody) return;

    const allReqs = this.networkRequests.get(this.activeDeviceIndex) || [];
    const filtered = allReqs.filter(r => {
      if (this.networkFilterText && !r.url.toLowerCase().includes(this.networkFilterText)) return false;
      if (this.networkTypeFilter === 'fetch' && !r.type.includes('fetch') && !r.type.includes('xhr') && !r.type.includes('json')) return false;
      if (this.networkTypeFilter === 'js' && !r.type.includes('javascript') && !r.url.endsWith('.js')) return false;
      if (this.networkTypeFilter === 'css' && !r.type.includes('css') && !r.url.endsWith('.css')) return false;
      if (this.networkTypeFilter === 'img' && !r.type.includes('image')) return false;
      if (this.networkTypeFilter === 'doc' && !r.type.includes('html')) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="cdt-empty-state">No network requests recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const isErr = r.status >= 400 || r.status === 0;
      const statusClass = isErr ? 'cdt-net-err' : r.status === 304 ? 'cdt-net-cache' : 'cdt-net-ok';
      const isSelected = this.selectedNetworkItem?.id === r.id;

      return `
        <tr class="cdt-net-row ${isSelected ? 'selected' : ''}" data-id="${r.id}">
          <td class="cdt-net-name" title="${escapeHtml(r.url)}">${escapeHtml(r.name)}</td>
          <td class="cdt-net-status ${statusClass}">${r.status || '...'}</td>
          <td>${escapeHtml(r.method)}</td>
          <td>${escapeHtml(r.type || 'fetch')}</td>
          <td>${escapeHtml(r.size)}</td>
          <td>${r.duration ? `${r.duration} ms` : 'pending'}</td>
        </tr>
      `;
    }).join('');

    // Row click for detail pane
    const rows = tbody.querySelectorAll<HTMLTableRowElement>('.cdt-net-row');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        const target = allReqs.find(x => x.id === id);
        if (target) {
          this.selectedNetworkItem = target;
          rows.forEach(r => r.classList.remove('selected'));
          row.classList.add('selected');
          this.renderNetworkDetails();
        }
      });
    });
  }

  private renderNetworkDetails() {
    const pane = this.container.querySelector<HTMLElement>('.cdt-network-details-pane');
    if (!pane) return;
    if (!this.selectedNetworkItem) {
      pane.style.display = 'none';
      return;
    }

    pane.style.display = 'flex';
    const item = this.selectedNetworkItem;

    pane.innerHTML = `
      <div class="cdt-net-details-header">
        <div class="cdt-net-subtabs">
          <button class="cdt-net-tab ${this.networkDetailsTab === 'headers' ? 'active' : ''}" data-subtab="headers">Headers</button>
          <button class="cdt-net-tab ${this.networkDetailsTab === 'preview' ? 'active' : ''}" data-subtab="preview">Preview</button>
          <button class="cdt-net-tab ${this.networkDetailsTab === 'response' ? 'active' : ''}" data-subtab="response">Response</button>
        </div>
        <button class="cdt-mini-btn cdt-btn-close-details">✕</button>
      </div>
      <div class="cdt-net-details-body">
        ${this.renderNetworkSubtabContent(item)}
      </div>
    `;

    pane.querySelector('.cdt-btn-close-details')?.addEventListener('click', () => {
      this.selectedNetworkItem = null;
      pane.style.display = 'none';
    });

    pane.querySelectorAll<HTMLButtonElement>('.cdt-net-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.networkDetailsTab = (btn.getAttribute('data-subtab') as any) || 'headers';
        this.renderNetworkDetails();
      });
    });
  }

  private renderNetworkSubtabContent(item: NetworkItem): string {
    if (this.networkDetailsTab === 'headers') {
      const headersList = Object.entries(item.headers || {})
        .map(([k, v]) => `<div><strong style="color:#8ab4f8;">${escapeHtml(k)}:</strong> <span style="color:#e8eaed;">${escapeHtml(v)}</span></div>`)
        .join('');

      return `
        <div class="cdt-net-section">
          <div class="cdt-net-section-title">General</div>
          <div><strong style="color:#8ab4f8;">Request URL:</strong> ${escapeHtml(item.url)}</div>
          <div><strong style="color:#8ab4f8;">Request Method:</strong> ${escapeHtml(item.method)}</div>
          <div><strong style="color:#8ab4f8;">Status Code:</strong> ${item.status} ${escapeHtml(item.statusText)}</div>
        </div>
        <div class="cdt-net-section" style="margin-top:10px;">
          <div class="cdt-net-section-title">Response Headers</div>
          ${headersList || '<div style="color:#9aa0a6;">(No custom headers recorded)</div>'}
        </div>
      `;
    } else {
      if (!item.responseBody) {
        return '<div class="cdt-empty-state">No response payload recorded.</div>';
      }
      return `
        <pre class="cdt-code-preview">${escapeHtml(item.responseBody)}</pre>
      `;
    }
  }

  // --- Application Panel Rendering ---
  private renderApplication(storageData: any) {
    const tbody = this.container.querySelector<HTMLTableSectionElement>('.cdt-app-table tbody');
    if (!tbody) return;

    const activeType = this.container.querySelector('.cdt-app-tree-item.active')?.getAttribute('data-app-type') || 'local';
    const items: Record<string, string> = storageData ? (storageData[activeType] || {}) : {};

    const entries = Object.entries(items);
    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="cdt-empty-state">(No entries in storage)</td></tr>';
      return;
    }

    tbody.innerHTML = entries.map(([k, v]) => `
      <tr>
        <td style="color:#8ab4f8;font-weight:500;">${escapeHtml(k)}</td>
        <td style="color:#a8c7fa;word-break:break-all;">${escapeHtml(v)}</td>
      </tr>
    `).join('');
  }

  // --- Device Metrics Info Rendering ---
  private renderInfo() {
    const pane = this.container.querySelector<HTMLElement>('.cdt-info-content');
    if (!pane) return;

    const devices = this.options.getActiveDevices();
    const curDevice = devices.find(d => d.index === this.activeDeviceIndex) || devices[0];

    pane.innerHTML = `
      <div class="cdt-info-card">
        <h3 style="margin-top:0;color:#8ab4f8;font-size:14px;border-bottom:1px solid #3c4043;padding-bottom:6px;">📱 Device Emulation Metrics</h3>
        <table class="cdt-info-table">
          <tr><td style="color:#9aa0a6;width:160px;">Device Preset:</td><td style="font-weight:600;">${escapeHtml(curDevice?.name || 'Mobile Device')}</td></tr>
          <tr><td style="color:#9aa0a6;">Target URL:</td><td style="color:#8ab4f8;word-break:break-all;">${escapeHtml(curDevice?.url || 'about:blank')}</td></tr>
          <tr><td style="color:#9aa0a6;">Active Slot:</td><td>Slot ${this.activeDeviceIndex + 1} of ${devices.length}</td></tr>
          <tr><td style="color:#9aa0a6;">Touch Emulation:</td><td>Active (Bézier Drag & Momentum Physics)</td></tr>
          <tr><td style="color:#9aa0a6;">User Agent Emulation:</td><td style="word-break:break-all;">${escapeHtml(navigator.userAgent)}</td></tr>
        </table>
      </div>
    `;
  }
}

// Helpers
function escapeHtml(str: string): string {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeParseUrl(urlStr: string): URL | null {
  try {
    return new URL(urlStr, window.location.href);
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function cleanMimeType(mime: string): string {
  if (!mime) return 'fetch';
  if (mime.includes('json')) return 'json';
  if (mime.includes('javascript')) return 'script';
  if (mime.includes('css')) return 'stylesheet';
  if (mime.includes('html')) return 'document';
  if (mime.includes('image')) return 'image';
  return 'fetch';
}
