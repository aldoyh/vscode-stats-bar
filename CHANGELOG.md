# Change Log

All notable changes to the stats bar extension will be documented in this file.

## [0.6.0] - 2026-02-08

### Added

- **New Modules**: Disk usage monitoring, Battery status for laptops, and CPU Temperature monitoring
- **Color Coding**: Visual warnings for high CPU (>75% yellow, >90% red), CPU temperature (>70°C yellow, >80°C red), memory, and disk usage
- **Enhanced Tooltips**: More detailed information in hover tooltips for all modules
- **Better Error Handling**: Improved error handling with console logging for debugging
- **Type Safety**: Enhanced TypeScript type safety throughout the codebase

### Changed

- **Updated Dependencies**: 
  - systeminformation updated from 5.12.3 to 5.30.7 (latest stable)
  - TypeScript updated from 4.3.2 to 4.9.5
  - Prettier updated from 2.3.2 to 2.8.8
- **Improved Code Quality**: Fixed linter warnings and improved code consistency
- **Maximum Modules**: Increased from 5 to 8 to accommodate new features

### Fixed

- Fixed type safety issues in utility functions
- Removed unused parameters to eliminate warnings

## [0.5.2] - 2022-08-07

### Fixed

- High cpu usage on Windows [#4](https://github.com/njzydark/vscode-stats-bar/issues/4) and may be [#1](https://github.com/njzydark/vscode-stats-bar/issues/1)

## [0.5.1] - 2022-07-17

### Added

- Update dependency [systeminformation](https://github.com/sebhildebrandt/systeminformation/blob/master/CHANGELOG.md) to latest version(from 5.8.0 to 5.12.1)

### Fixed

- Fix the problem that adjusting the configuration of local machine will affect the configuration of remote machine

## [0.5.0] - 2021-11-22

### Added

- Support use `${pressurePercent}` to show memory pressure (only for macOS)
- Add tooltip to status item

### Fixed

- Memory usage is inaccurately displayed on Apple Silicon [#2](https://github.com/njzydark/vscode-stats-bar/issues/2)

## [0.4.1] - 2021-08-29

### Changed

- Adjust the order configuration and help description in the settings

## [0.4.0] - 2021-08-29

### Added

- Support custom display order and priority

## [0.3.0] - 2021-08-28

### Added

- Support custom display format

## [0.2.0] - 2021-08-27

### Added

- Support show memory usage and uptime

### Fixed

- Separate configurations for different workspaces

## [0.1.0] - 2021-08-27

### Added

- Support show cpu load, loadavg and network speed
- Support copy ip to clipboard
- Support change loacation and refresh interval
