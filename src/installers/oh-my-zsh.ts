/**
 * Oh My Zsh installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installOhMyZsh = async (): Promise<boolean> => {
  logger.step('Installing Oh My Zsh...');

  const ohmyzshDir = `${platform.homeDir}/.oh-my-zsh`;

  // Check if already installed
  const dirExists = await Bun.file(`${ohmyzshDir}/oh-my-zsh.sh`).exists();
  if (dirExists) {
    logger.info('Oh My Zsh is already installed');
    return true;
  }

  // Download and install Oh My Zsh
  const installScript = 'https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh';

  try {
    const response = await fetch(installScript);
    const script = await response.text();

    // Save script
    const scriptPath = '/tmp/install-ohmyzsh.sh';
    await Bun.write(scriptPath, script);

    // Run installation (unattended)
    const result = await shell.exec(
      `sh ${scriptPath} --unattended`,
      { env: { RUNZSH: 'no', CHSH: 'no' } }
    );

    if (result.success) {
      logger.success('Oh My Zsh installed successfully');
      return true;
    } else {
      logger.error('Failed to install Oh My Zsh');
      return false;
    }
  } catch (error) {
    logger.error(`Failed to install Oh My Zsh: ${error}`);
    return false;
  }
};
