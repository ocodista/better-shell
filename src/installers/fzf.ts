/**
 * fzf fuzzy finder installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installFzf = async (): Promise<boolean> => {
  logger.step('Installing fzf...');

  // Check if already installed
  if (await shell.commandExists('fzf')) {
    logger.info('fzf is already installed');
    return true;
  }

  // Install based on platform
  if (platform.isMac()) {
    const result = await shell.exec('brew install fzf', { silent: false });
    if (!result.success) return false;

    // Install key bindings
    await shell.exec('$(brew --prefix)/opt/fzf/install --all --no-bash --no-fish', {
      silent: false,
      ignoreError: true,
    });

    logger.success('fzf installed successfully');
    return true;
  } else if (platform.isLinux()) {
    // Clone fzf repository
    const fzfDir = `${platform.homeDir}/.fzf`;

    // Check if directory exists
    if (await Bun.file(`${fzfDir}/bin/fzf`).exists()) {
      logger.info('fzf is already installed');
      return true;
    }

    const cloneResult = await shell.exec(
      `git clone --depth 1 https://github.com/junegunn/fzf.git ${fzfDir}`,
      { silent: false }
    );

    if (!cloneResult.success) return false;

    // Run installation script
    const result = await shell.exec(`${fzfDir}/install --all --no-bash --no-fish`, {
      silent: false,
    });

    if (result.success) {
      logger.success('fzf installed successfully');
      return true;
    }
  }

  logger.error('Failed to install fzf');
  return false;
};
