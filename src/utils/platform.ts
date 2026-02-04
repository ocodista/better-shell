/**
 * Platform detection utilities
 */

export type Platform = 'macos' | 'linux' | 'windows' | 'unknown';
export type Arch = 'x64' | 'arm64' | 'unknown';

export const platform = {
  get current(): Platform {
    const p = process.platform;
    if (p === 'darwin') return 'macos';
    if (p === 'linux') return 'linux';
    if (p === 'win32') return 'windows';
    return 'unknown';
  },

  get arch(): Arch {
    const a = process.arch;
    if (a === 'x64') return 'x64';
    if (a === 'arm64') return 'arm64';
    return 'unknown';
  },

  isMac: () => platform.current === 'macos',
  isLinux: () => platform.current === 'linux',
  isWindows: () => platform.current === 'windows',

  get packageManager(): 'brew' | 'apt' | 'dnf' | 'pacman' | 'unknown' {
    if (platform.isMac()) return 'brew';

    // Check for Linux package managers
    try {
      Bun.spawnSync(['which', 'apt-get']);
      return 'apt';
    } catch {}

    try {
      Bun.spawnSync(['which', 'dnf']);
      return 'dnf';
    } catch {}

    try {
      Bun.spawnSync(['which', 'pacman']);
      return 'pacman';
    } catch {}

    return 'unknown';
  },

  get homeDir(): string {
    // When running with sudo, get the actual user's home directory
    if (process.env.SUDO_USER) {
      const sudoUser = process.env.SUDO_USER;
      const { execSync } = require('child_process');
      try {
        return execSync(`eval echo ~${sudoUser}`, { encoding: 'utf-8' }).trim();
      } catch {
        // Fallback to environment variables if eval fails
        return process.env.HOME || process.env.USERPROFILE || '~';
      }
    }
    return process.env.HOME || process.env.USERPROFILE || '~';
  },

  get shell(): string {
    return process.env.SHELL || '/bin/bash';
  },
};
