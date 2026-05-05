/**
 * Zsh installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';
import { installPackages } from '../utils/package-manager';

export const installZsh = async (): Promise<boolean> => {
  logger.step('Installing zsh...');

  // Check if already installed
  if (await shell.commandExists('zsh')) {
    logger.info('zsh is already installed');
    return true;
  }

  if (platform.isMac() || platform.isLinux()) {
    return installPackages(['zsh'], { silent: false });
  }

  logger.error('Unsupported platform for zsh installation');
  return false;
};

export const setZshAsDefault = async (): Promise<boolean> => {
  logger.step('Setting zsh as default shell...');

  const zshPath = (await shell.exec('command -v zsh', { silent: true })).stdout.trim();

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
    logger.warn('Could not set zsh as default shell. You may need to run: chsh -s $(command -v zsh)');
    return false;
  }
};
