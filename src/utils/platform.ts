/**
 * Platform detection utilities
 */

import { execSync } from 'node:child_process';

export type Platform = 'macos' | 'linux' | 'windows' | 'unknown';
export type Arch = 'x64' | 'arm64' | 'unknown';
export type PackageManager = 'brew' | 'apt' | 'dnf' | 'pacman' | 'apk' | 'unknown';

type CommandExists = (command: string) => boolean;

export const normalizePlatform = (nodePlatform: string): Platform => {
  if (nodePlatform === 'darwin') return 'macos';
  if (nodePlatform === 'linux') return 'linux';
  if (nodePlatform === 'win32') return 'windows';
  return 'unknown';
};

export const normalizeArch = (nodeArch: string): Arch => {
  if (nodeArch === 'x64') return 'x64';
  if (nodeArch === 'arm64') return 'arm64';
  return 'unknown';
};

export const detectPackageManager = (
  currentPlatform: Platform,
  commandExists: CommandExists
): PackageManager => {
  if (currentPlatform === 'macos') return 'brew';
  if (currentPlatform !== 'linux') return 'unknown';

  if (commandExists('apt-get')) return 'apt';
  if (commandExists('dnf')) return 'dnf';
  if (commandExists('pacman')) return 'pacman';
  if (commandExists('apk')) return 'apk';

  return 'unknown';
};

const commandExistsSync: CommandExists = (command) => {
  const result = Bun.spawnSync(['sh', '-c', `command -v ${command}`], {
    stdout: 'ignore',
    stderr: 'ignore',
  });

  return result.success;
};

export const platform = {
  get current(): Platform {
    return normalizePlatform(process.platform);
  },

  get arch(): Arch {
    return normalizeArch(process.arch);
  },

  isMac: () => platform.current === 'macos',
  isLinux: () => platform.current === 'linux',
  isWindows: () => platform.current === 'windows',

  get packageManager(): PackageManager {
    return detectPackageManager(platform.current, commandExistsSync);
  },

  get homeDir(): string {
    // When running with sudo, get the actual user's home directory
    if (process.env.SUDO_USER) {
      const sudoUser = process.env.SUDO_USER;
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
    return process.env.SHELL || process.env.COMSPEC || '/bin/bash';
  },
};
