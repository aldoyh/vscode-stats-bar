import { ExtensionContext, StatusBarAlignment, StatusBarItem, window } from 'vscode';
import { ConfigurationKeys } from './types';
import { sysinfoData, SysinfoData, StatsModule, StatsModuleNameMap, siInit, siRelease } from './sysinfo';
import { setting } from './setting';
import { formatBytes, formatTimes, formatByDict, isDarwin } from './utils';

type Await<T extends () => unknown> = T extends () => PromiseLike<infer U> ? U : ReturnType<T>;

class StatsBar {
  statusItems: StatusBarItem[] = [];
  timer: NodeJS.Timeout | null = null;
  _context: ExtensionContext | null = null;

  init(context: ExtensionContext) {
    this._context = context;
    siInit();
    this.start();
  }

  private start() {
    if (!this._context) {
      return;
    }
    if (this.statusItems.length > 0) {
      this.statusItems.forEach(statusItem => {
        statusItem.dispose();
      });
    }
    const curModules = setting.curModules;
    if (!setting?.cfg?.get(ConfigurationKeys.AllEnabled) || curModules.length === 0) {
      return;
    }
    const location = (setting?.cfg?.get(ConfigurationKeys.Location) || 'Left') as StatusBarAlignment;
    const priority: number = setting?.cfg?.get(ConfigurationKeys.Priority) || setting.default.priority;
    this.statusItems = curModules.map(() => window.createStatusBarItem(StatusBarAlignment[location], priority));
    this._context.subscriptions.push(...this.statusItems);
    this.update();
  }

  private async update() {
    this.getSysInfo();
    this.timer = setInterval(() => {
      this.getSysInfo();
    }, setting?.cfg?.get(ConfigurationKeys.RefreshInterval) || setting.default.refreshInterval);
  }

  private async getSysInfo() {
    const promises = setting.curModules.map(async module => {
      try {
        const res = await sysinfoData[module]();
        return this.formatRes(module, res) || { module, text: '-', tooltip: StatsModuleNameMap[module] };
      } catch (error) {
        console.error(`Error getting ${module} info:`, error);
        return { module, text: '-', tooltip: `${StatsModuleNameMap[module]} (Error)` };
      }
    });
    const res = await Promise.all(promises);
    res.forEach((data, index) => {
      const curStatusItem = this.statusItems[index];
      curStatusItem.text = data.text;
      curStatusItem.tooltip = data.tooltip || StatsModuleNameMap[data.module];
      curStatusItem.command = undefined; // Clear any previous commands

      // Color coding for warnings
      if (data.module === 'cpuLoad' || data.module === 'memoUsage' || data.module === 'diskUsage') {
        const percentMatch = data.text.match(/(\d+)%/);
        if (percentMatch) {
          const percent = parseInt(percentMatch[1]);
          if (percent >= 90) {
            curStatusItem.backgroundColor = { id: 'statusBarItem.errorBackground' };
          } else if (percent >= 75) {
            curStatusItem.backgroundColor = { id: 'statusBarItem.warningBackground' };
          } else {
            curStatusItem.backgroundColor = undefined;
          }
        }
      }

      curStatusItem.show();
    });
  }

  private formatRes(module: StatsModule, rawRes: unknown) {
    const formatedData = {
      module,
      text: '-',
      tooltip: ''
    };
    if (module === 'cpuLoad') {
      const res = rawRes as Await<SysinfoData['cpuLoad']>;
      if (res) {
        const percent = res.toFixed(0);
        const dict = {
          percent
        };
        formatedData.text = formatByDict(setting.cfg?.get(ConfigurationKeys.CpuLoadFormat), dict);
        formatedData.tooltip = `CPU Load: ${percent}%`;
      }
    } else if (module === 'loadavg') {
      const res = rawRes as Await<SysinfoData['loadavg']>;
      if (res) {
        const dict = {
          '1': res[0]?.toFixed(2) || 0,
          '5': res[1]?.toFixed(2) || 0,
          '15': res[2]?.toFixed(2) || 0
        };
        formatedData.text = formatByDict(setting.cfg?.get(ConfigurationKeys.LoadavgFormat), dict);
        formatedData.tooltip = `Load Average: 1m: ${dict['1']}, 5m: ${dict['5']}, 15m: ${dict['15']}`;
      }
    } else if (module === 'memoUsage') {
      const res = rawRes as Await<SysinfoData['memoUsage']>;
      if (res) {
        const customSize = 1024 * 1024 * 1024;
        const used = formatBytes(isDarwin ? res.used : res.active, 2, customSize);
        const total = formatBytes(res.total, 2, customSize);
        const percent = ((Number(used.data) / Number(total.data)) * 100).toFixed(0);
        const pressurePercent = Number((res.pressurePercent || 0) * 100).toFixed(0);

        const dict = {
          used: used.data,
          total: total.data,
          unit: 'GB',
          percent,
          pressurePercent
        };

        formatedData.text = formatByDict(setting.cfg?.get(ConfigurationKeys.MemoUsageFormat), dict);
        formatedData.tooltip = `Memory: ${used.data}/${total.data} GB (${percent}%)${
          isDarwin ? ` - Pressure: ${pressurePercent}%` : ''
        }`;
      }
    } else if (module === 'networkSpeed') {
      const res = rawRes as Await<SysinfoData['networkSpeed']>;
      if (res) {
        const up = formatBytes(res.up);
        const down = formatBytes(res.down);

        const dict = {
          up: up.data,
          'up-unit': up.unit + '/s',
          down: down.data,
          'down-unit': down.unit + '/s'
        };

        formatedData.text = formatByDict(setting.cfg?.get(ConfigurationKeys.NetworkSpeedFormat), dict);
        formatedData.tooltip = `Network: ↑${up.data} ${up.unit}/s ↓${down.data} ${down.unit}/s`;
      }
    } else if (module === 'uptime') {
      const res = rawRes as Await<SysinfoData['uptime']>;
      if (res) {
        const data = formatTimes(res);

        const dict = {
          days: data[0],
          hours: data[1],
          minutes: data[2]
        };

        formatedData.text = formatByDict(setting.cfg?.get(ConfigurationKeys.UptimeFormat), dict);
        formatedData.tooltip = `System Uptime: ${data[0]}d ${data[1]}h ${data[2]}m`;
      }
    } else if (module === 'diskUsage') {
      const res = rawRes as Await<SysinfoData['diskUsage']>;
      if (res) {
        const customSize = 1024 * 1024 * 1024;
        const used = formatBytes(res.used, 2, customSize);
        const total = formatBytes(res.size, 2, customSize);
        const available = formatBytes(res.available, 2, customSize);
        const percent = res.use.toFixed(0);

        const dict = {
          used: used.data,
          total: total.data,
          available: available.data,
          unit: 'GB',
          percent,
          mount: res.mount
        };

        formatedData.text = formatByDict(setting.cfg?.get(ConfigurationKeys.DiskUsageFormat), dict);
        formatedData.tooltip = `Disk (${res.mount}): ${used.data}/${total.data} GB (${percent}%) - Available: ${available.data} GB`;
      }
    } else if (module === 'battery') {
      const res = rawRes as Await<SysinfoData['battery']>;
      if (res && res.hasBattery) {
        const percent = res.percent;
        const isCharging = res.isCharging;
        const timeRemaining = res.timeRemaining > 0 ? Math.floor(res.timeRemaining / 60) : 0;

        const dict = {
          percent: percent,
          charging: isCharging ? 'Charging' : '',
          time: timeRemaining
        };

        formatedData.text = formatByDict(setting.cfg?.get(ConfigurationKeys.BatteryFormat), dict);
        formatedData.tooltip = `Battery: ${percent}%${isCharging ? ' (Charging)' : ''}${
          timeRemaining > 0 ? ` - ${timeRemaining} min remaining` : ''
        }`;
      }
    }
    return formatedData;
  }

  onSettingUpdate() {
    this.cancelUpdate();
    this.start();
  }

  cancelUpdate(isDeactivate = false) {
    if (isDeactivate) {
      siRelease();
    }
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

export const statsBar = new StatsBar();
