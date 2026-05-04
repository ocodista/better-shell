import { describe, expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import {
  detectPackageManager,
  normalizeArch,
  normalizePlatform,
  platform,
} from './platform';

const commandExistsFor = (commands: readonly string[]) => (command: string) =>
  commands.includes(command);

describe('platform normalization', () => {
  test('maps supported Node platforms to installer platforms', () => {
    expect(normalizePlatform('darwin')).toBe('macos');
    expect(normalizePlatform('linux')).toBe('linux');
    expect(normalizePlatform('win32')).toBe('windows');
  });

  test('marks unsupported platforms as unknown', () => {
    expect(normalizePlatform('freebsd')).toBe('unknown');
    expect(normalizePlatform('sunos')).toBe('unknown');
  });

  test('maps supported CPU architectures', () => {
    expect(normalizeArch('x64')).toBe('x64');
    expect(normalizeArch('arm64')).toBe('arm64');
  });

  test('marks unsupported CPU architectures as unknown', () => {
    expect(normalizeArch('ia32')).toBe('unknown');
    expect(normalizeArch('riscv64')).toBe('unknown');
  });
});

describe('platform detection', () => {
  test('consistently identifies the same platform', () => {
    const first = platform.current;
    const second = platform.current;

    expect(first).toBe(second);
  });

  test('consistently identifies the same architecture', () => {
    const first = platform.arch;
    const second = platform.arch;

    expect(first).toBe(second);
  });

  test('activates exactly one platform helper for known platforms', () => {
    const isMac = platform.isMac();
    const isLinux = platform.isLinux();
    const isWindows = platform.isWindows();

    const platformCount = [isMac, isLinux, isWindows].filter(Boolean).length;

    // On unknown platforms all would be false, otherwise exactly one is true
    if (platform.current !== 'unknown') {
      expect(platformCount).toBe(1);
    } else {
      expect(platformCount).toBe(0);
    }
  });

  test('matches helpers to platform.current', () => {
    if (platform.current === 'macos') {
      expect(platform.isMac()).toBe(true);
      expect(platform.isLinux()).toBe(false);
      expect(platform.isWindows()).toBe(false);
    } else if (platform.current === 'linux') {
      expect(platform.isMac()).toBe(false);
      expect(platform.isLinux()).toBe(true);
      expect(platform.isWindows()).toBe(false);
    } else if (platform.current === 'windows') {
      expect(platform.isMac()).toBe(false);
      expect(platform.isLinux()).toBe(false);
      expect(platform.isWindows()).toBe(true);
    }
  });
});

describe('home directory', () => {
  test('returns an absolute path', () => {
    const home = platform.homeDir;

    expect(isAbsolute(home)).toBe(true);
  });

  test('allows reading directory contents', async () => {
    const home = platform.homeDir;

    await expect(readdir(home)).resolves.toBeDefined();
  });
});

describe('shell detection', () => {
  test('returns a non-empty shell path', () => {
    expect(platform.shell.length).toBeGreaterThan(0);
  });

  test('identifies an executable shell on POSIX systems', () => {
    if (platform.isWindows()) return;

    const result = Bun.spawnSync(['test', '-x', platform.shell]);
    expect(result.exitCode).toBe(0);
  });
});

describe('package manager detection', () => {
  test('detects brew on macOS without probing commands', () => {
    const commandExists = () => {
      throw new Error('macOS should not probe Linux package managers');
    };

    expect(detectPackageManager('macos', commandExists)).toBe('brew');
  });

  test('detects apt on Debian and Ubuntu systems', () => {
    const pm = detectPackageManager('linux', commandExistsFor(['apt-get']));

    expect(pm).toBe('apt');
  });

  test('detects dnf on Fedora systems', () => {
    const pm = detectPackageManager('linux', commandExistsFor(['dnf']));

    expect(pm).toBe('dnf');
  });

  test('detects pacman on Arch systems', () => {
    const pm = detectPackageManager('linux', commandExistsFor(['pacman']));

    expect(pm).toBe('pacman');
  });

  test('detects apk on Alpine systems', () => {
    const pm = detectPackageManager('linux', commandExistsFor(['apk']));

    expect(pm).toBe('apk');
  });

  test('does not detect Unix package managers for native Windows', () => {
    const pm = detectPackageManager('windows', commandExistsFor(['apt-get', 'apk', 'brew']));

    expect(pm).toBe('unknown');
  });

  test('returns unknown when Linux has no supported package manager', () => {
    const pm = detectPackageManager('linux', commandExistsFor([]));

    expect(pm).toBe('unknown');
  });

  test('returns consistent package manager', () => {
    const first = platform.packageManager;
    const second = platform.packageManager;

    expect(first).toBe(second);
  });

  test('detects a supported package manager on Linux', () => {
    if (platform.isLinux()) {
      const pm = platform.packageManager;
      const validLinuxPMs = ['apt', 'dnf', 'pacman', 'apk', 'unknown'];

      expect(validLinuxPMs).toContain(pm);
    }
  });
});
