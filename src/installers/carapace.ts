/**
 * Carapace multi-shell completion installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installCarapace = async (): Promise<boolean> => {
  logger.step('Installing carapace...');

  // Check if already installed
  if (await shell.commandExists('carapace')) {
    logger.info('carapace is already installed');
    return true;
  }

  // Install based on platform
  if (platform.isMac()) {
    const result = await shell.exec('brew install carapace', { silent: false });

    if (result.success) {
      logger.success('carapace installed successfully');
      return true;
    }
  } else if (platform.isLinux()) {
    const pkgManager = platform.packageManager;

    // Method 1: Try package manager first (fury.io repos)
    if (pkgManager === 'apt') {
      logger.info('Trying to install carapace via apt (fury.io)...');

      // Add fury.io repository
      const addRepoResult = await shell.exec(
        'echo "deb [trusted=yes] https://apt.fury.io/rsteube/ /" > /etc/apt/sources.list.d/fury.list',
        { silent: true, ignoreError: true }
      );

      if (addRepoResult.success) {
        await shell.exec('apt-get update', { silent: true, ignoreError: true });
        const installResult = await shell.exec('apt-get install -y carapace-bin', {
          silent: true,
          ignoreError: true,
        });

        if (installResult.success && (await shell.commandExists('carapace'))) {
          logger.success('carapace installed successfully');
          return true;
        }
      }
    }

    // Method 2: Manual download from GitHub releases
    logger.info('Downloading carapace from GitHub releases...');

    const arch = platform.arch === 'arm64' ? 'arm64' : 'amd64';
    // Try to get the latest release version
    const versionResult = await shell.exec(
      'curl -sL https://api.github.com/repos/carapace-sh/carapace-bin/releases/latest | grep -o \'"tag_name": "[^"]*"\' | cut -d\'"\' -f4',
      { silent: true, ignoreError: true }
    );

    let version = versionResult.stdout.trim();
    if (!version || version === '') {
      version = 'v1.0.6'; // Fallback version
    }

    const url = `https://github.com/carapace-sh/carapace-bin/releases/download/${version}/carapace-bin_linux_${arch}.tar.gz`;
    const tarPath = '/tmp/carapace.tar.gz';

    const downloadSuccess = await shell.download(url, tarPath);

    if (!downloadSuccess) {
      logger.warn('Failed to download carapace, skipping...');
      return true; // Don't fail the entire installation
    }

    // Extract and install
    await shell.exec('mkdir -p /tmp/carapace', { silent: true });
    const extractResult = await shell.exec(`tar xzf ${tarPath} -C /tmp/carapace`, {
      silent: true,
      ignoreError: true,
    });

    if (!extractResult.success) {
      logger.warn('Failed to extract carapace, skipping...');
      return true;
    }

    const installResult = await shell.exec('mv /tmp/carapace/carapace /usr/local/bin/', {
      silent: true,
      ignoreError: true,
    });

    if (installResult.success && (await shell.commandExists('carapace'))) {
      logger.success('carapace installed successfully');
      return true;
    }
  }

  logger.warn('Failed to install carapace, skipping...');
  return true; // Don't fail the entire installation
};
