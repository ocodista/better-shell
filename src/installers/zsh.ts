/**
 * Zsh installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installZsh = async (): Promise<boolean> => {
  logger.step('Installing zsh...');

  // Check if already installed
  if (await shell.commandExists('zsh')) {
    logger.info('zsh is already installed');
    return true;
  }

  // Install based on platform
  if (platform.isMac()) {
    const result = await shell.exec('brew install zsh', { silent: false });
    return result.success;
  } else if (platform.isLinux()) {
    const pm = platform.packageManager;

    if (pm === 'apt') {
      await shell.exec('apt-get update', { silent: true });
      const result = await shell.exec('apt-get install -y zsh', { silent: false });
      return result.success;
    } else if (pm === 'dnf') {
      const result = await shell.exec('dnf install -y zsh', { silent: false });
      return result.success;
    } else if (pm === 'pacman') {
      const result = await shell.exec('pacman -S --noconfirm zsh', { silent: false });
      return result.success;
    }
  }

  logger.error('Unsupported platform for zsh installation');
  return false;
};

export const setZshAsDefault = async (): Promise<boolean> => {
  logger.step('Setting zsh as default shell...');

  const zshPath = (await shell.exec('which zsh', { silent: true })).stdout.trim();

  if (!zshPath) {
    logger.error('Could not find zsh installation');
    return false;
  }

  // Check if zsh is in /etc/shells
  const shells = (await shell.exec('cat /etc/shells', { silent: true })).stdout;
  if (!shells.includes(zshPath)) {
    logger.info('Adding zsh to /etc/shells...');
    await shell.exec(`echo "${zshPath}" | sudo tee -a /etc/shells`, { silent: true });
  }

  // Change default shell
  const result = await shell.exec(`chsh -s ${zshPath}`, { silent: false });

  if (result.success) {
    logger.success('zsh set as default shell');
    return true;
  } else {
    logger.warn('Could not set zsh as default shell. You may need to run: chsh -s $(which zsh)');
    return false;
  }
};
