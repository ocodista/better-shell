/**
 * Font installer (FiraCode Nerd Font)
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installFiraCode = async (): Promise<boolean> => {
  logger.step('Installing FiraCode Nerd Font...');

  if (platform.isMac()) {
    // Check if already installed
    const checkResult = await shell.exec('brew list --cask font-fira-code-nerd-font', {
      silent: true,
      ignoreError: true,
    });

    if (checkResult.success) {
      logger.info('FiraCode Nerd Font is already installed');
      return true;
    }

    // Tap homebrew-cask-fonts
    await shell.exec('brew tap homebrew/cask-fonts', {
      silent: false,
      ignoreError: true,
    });

    // Install font
    const result = await shell.exec('brew install --cask font-fira-code-nerd-font', {
      silent: false,
    });

    if (result.success) {
      logger.success('FiraCode Nerd Font installed successfully');
      return true;
    } else {
      logger.error('Failed to install FiraCode Nerd Font');
      return false;
    }
  } else if (platform.isLinux()) {
    // Download and install manually on Linux
    const fontsDir = `${platform.homeDir}/.local/share/fonts`;
    const firaCodeDir = `${fontsDir}/FiraCode`;

    // Check if already installed
    if (await Bun.file(`${firaCodeDir}/FiraCodeNerdFont-Regular.ttf`).exists()) {
      logger.info('FiraCode Nerd Font is already installed');
      return true;
    }

    // Ensure fontconfig is installed (for fc-cache command)
    const pkgManager = platform.packageManager;
    if (pkgManager !== 'unknown') {
      await shell.exec(`${pkgManager} install -y fontconfig`, {
        silent: true,
        ignoreError: true,
      });
    }

    // Create fonts directory
    await shell.exec(`mkdir -p ${firaCodeDir}`, { silent: true });

    // Download FiraCode Nerd Font
    const version = 'v3.1.1';
    const url = `https://github.com/ryanoasis/nerd-fonts/releases/download/${version}/FiraCode.zip`;
    const zipPath = '/tmp/FiraCode.zip';

    logger.info('Downloading FiraCode Nerd Font...');
    const downloadSuccess = await shell.download(url, zipPath);

    if (!downloadSuccess) {
      logger.error('Failed to download FiraCode Nerd Font');
      return false;
    }

    // Extract fonts
    logger.info('Extracting fonts...');
    const extractResult = await shell.exec(`unzip -o ${zipPath} -d ${firaCodeDir}`, {
      silent: true,
    });

    if (!extractResult.success) {
      logger.error('Failed to extract fonts');
      return false;
    }

    // Update font cache
    logger.info('Updating font cache...');
    await shell.exec('fc-cache -fv', { silent: true });

    logger.success('FiraCode Nerd Font installed successfully');
    return true;
  }

  logger.warn('Font installation not supported on this platform');
  return true; // Don't fail the entire installation
};
