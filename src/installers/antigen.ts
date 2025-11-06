/**
 * Antigen plugin manager installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installAntigen = async (): Promise<boolean> => {
  logger.step('Installing Antigen...');

  const antigenPath = `${platform.homeDir}/antigen.zsh`;

  // Check if already installed
  if (await Bun.file(antigenPath).exists()) {
    logger.info('Antigen is already installed');
    return true;
  }

  // Download Antigen
  const antigenUrl = 'https://git.io/antigen';

  try {
    const success = await shell.download(antigenUrl, antigenPath);

    if (success) {
      logger.success('Antigen installed successfully');
      return true;
    } else {
      logger.error('Failed to download Antigen');
      return false;
    }
  } catch (error) {
    logger.error(`Failed to install Antigen: ${error}`);
    return false;
  }
};
