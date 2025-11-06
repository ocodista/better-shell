/**
 * tmux terminal multiplexer installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installTmux = async (): Promise<boolean> => {
  logger.step('Installing tmux...');

  // Check if already installed
  if (await shell.commandExists('tmux')) {
    logger.info('tmux is already installed');
    return true;
  }

  // Install based on platform
  if (platform.isMac()) {
    const result = await shell.exec('brew install tmux', { silent: false });
    return result.success;
  } else if (platform.isLinux()) {
    const pm = platform.packageManager;

    if (pm === 'apt') {
      await shell.exec('apt-get update', { silent: true });
      const result = await shell.exec('apt-get install -y tmux', { silent: false });
      return result.success;
    } else if (pm === 'dnf') {
      const result = await shell.exec('dnf install -y tmux', { silent: false });
      return result.success;
    } else if (pm === 'pacman') {
      const result = await shell.exec('pacman -S --noconfirm tmux', { silent: false });
      return result.success;
    }
  }

  logger.error('Failed to install tmux');
  return false;
};

export const installTpm = async (): Promise<boolean> => {
  logger.step('Installing TPM (Tmux Plugin Manager)...');

  const tpmDir = `${platform.homeDir}/.tmux/plugins/tpm`;

  // Check if already installed
  if (await Bun.file(`${tpmDir}/tpm`).exists()) {
    logger.info('TPM is already installed');
    return true;
  }

  // Clone TPM repository
  const result = await shell.exec(
    `git clone https://github.com/tmux-plugins/tpm ${tpmDir}`,
    { silent: false }
  );

  if (result.success) {
    logger.success('TPM installed successfully');
    logger.info('Run "prefix + I" in tmux to install plugins');
    return true;
  } else {
    logger.error('Failed to install TPM');
    return false;
  }
};
