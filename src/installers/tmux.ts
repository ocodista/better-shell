/**
 * tmux terminal multiplexer installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';
import { installPackages } from '../utils/package-manager';

export const installTmux = async (): Promise<boolean> => {
  logger.step('Installing tmux...');

  // Check if already installed
  if (await shell.commandExists('tmux')) {
    logger.info('tmux is already installed');
    return true;
  }

  if (platform.isMac() || platform.isLinux()) {
    return installPackages(['tmux'], { silent: false });
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
