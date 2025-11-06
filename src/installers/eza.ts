/**
 * eza (modern ls) installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installEza = async (): Promise<boolean> => {
  logger.step('Installing eza...');

  // Check if already installed
  if (await shell.commandExists('eza')) {
    logger.info('eza is already installed');
    return true;
  }

  // Install based on platform
  if (platform.isMac()) {
    const result = await shell.exec('brew install eza', { silent: false });

    if (result.success) {
      logger.success('eza installed successfully');
      return true;
    }
  } else if (platform.isLinux()) {
    const pm = platform.packageManager;

    if (pm === 'apt') {
      // eza requires a newer repo for most distributions
      await shell.exec('apt-get update', { silent: true });

      // Try installing from package manager first
      const result = await shell.exec('apt-get install -y eza', {
        silent: false,
        ignoreError: true,
      });

      if (result.success) {
        logger.success('eza installed successfully');
        return true;
      }

      // If not available, install via cargo or download binary
      logger.info('eza not in apt, trying alternative installation...');

      // Install via downloaded binary
      const arch = platform.arch === 'arm64' ? 'aarch64' : 'x86_64';
      const url = `https://github.com/eza-community/eza/releases/latest/download/eza_${arch}-unknown-linux-gnu.tar.gz`;
      const tarPath = '/tmp/eza.tar.gz';

      const downloadSuccess = await shell.download(url, tarPath);
      if (!downloadSuccess) {
        logger.error('Failed to download eza');
        return false;
      }

      // Extract and install
      await shell.exec('mkdir -p /tmp/eza', { silent: true });
      await shell.exec(`tar xzf ${tarPath} -C /tmp/eza`, { silent: false });
      const installResult = await shell.exec('mv /tmp/eza/eza /usr/local/bin/', {
        silent: false,
      });

      if (installResult.success) {
        logger.success('eza installed successfully');
        return true;
      }
    } else if (pm === 'dnf') {
      const result = await shell.exec('dnf install -y eza', { silent: false });
      return result.success;
    } else if (pm === 'pacman') {
      const result = await shell.exec('pacman -S --noconfirm eza', { silent: false });
      return result.success;
    }
  }

  logger.error('Failed to install eza');
  return false;
};
