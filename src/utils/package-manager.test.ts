import { describe, expect, test } from 'bun:test';
import { getPackageInstallPlan } from './package-manager';

describe('package install command planning', () => {
  test('plans Homebrew installs for macOS', () => {
    expect(getPackageInstallPlan('brew', ['zsh'])).toEqual({
      install: 'brew install zsh',
    });
  });

  test('plans apt installs for Debian and Ubuntu', () => {
    expect(getPackageInstallPlan('apt', ['zsh', 'tmux'])).toEqual({
      update: 'apt-get update',
      install: 'apt-get install -y zsh tmux',
    });
  });

  test('plans dnf installs for Fedora', () => {
    expect(getPackageInstallPlan('dnf', ['zsh'])).toEqual({
      install: 'dnf install -y zsh',
    });
  });

  test('plans pacman installs for Arch Linux', () => {
    expect(getPackageInstallPlan('pacman', ['zsh'])).toEqual({
      install: 'pacman -S --noconfirm zsh',
    });
  });

  test('plans apk installs for Alpine Linux', () => {
    expect(getPackageInstallPlan('apk', ['zsh'])).toEqual({
      install: 'apk add --no-cache zsh',
    });
  });

  test('does not plan installs for unknown package managers', () => {
    expect(getPackageInstallPlan('unknown', ['zsh'])).toBeUndefined();
  });

  test('does not plan empty installs', () => {
    expect(getPackageInstallPlan('apt', [])).toBeUndefined();
  });

  test('rejects unsafe package names', () => {
    expect(getPackageInstallPlan('apt', ['zsh; rm -rf /'])).toBeUndefined();
  });
});
