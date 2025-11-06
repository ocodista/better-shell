/**
 * asdf version manager installer
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';

export const installAsdf = async (): Promise<boolean> => {
  logger.step('Installing asdf...');

  const asdfDir = `${platform.homeDir}/.asdf`;

  // Check if already installed
  if (await Bun.file(`${asdfDir}/asdf.sh`).exists()) {
    logger.info('asdf is already installed');
    return true;
  }

  // Clone asdf repository
  const result = await shell.exec(
    `git clone https://github.com/asdf-vm/asdf.git ${asdfDir} --branch v0.14.1`,
    { silent: false }
  );

  if (result.success) {
    logger.success('asdf installed successfully');
    return true;
  } else {
    logger.error('Failed to install asdf');
    return false;
  }
};

export const installNodeWithAsdf = async (): Promise<boolean> => {
  logger.step('Installing Node.js LTS with asdf...');

  const asdfDir = `${platform.homeDir}/.asdf`;
  const asdfBin = `${asdfDir}/bin/asdf`;

  // Check if asdf is installed
  if (!(await Bun.file(asdfBin).exists())) {
    logger.error('asdf is not installed');
    return false;
  }

  try {
    // Set up environment with asdf in PATH
    const asdfEnv = {
      PATH: `${asdfDir}/bin:${asdfDir}/shims:${process.env.PATH}`,
      ASDF_DIR: asdfDir,
      ASDF_DATA_DIR: asdfDir,
    };

    // Add Node.js plugin
    logger.info('Adding Node.js plugin to asdf...');
    await shell.exec(`${asdfBin} plugin add nodejs`, {
      silent: false,
      ignoreError: true, // Plugin might already exist
      env: asdfEnv,
    });

    // Install latest LTS
    logger.info('Installing Node.js LTS (this may take a few minutes)...');
    const installResult = await shell.exec(`${asdfBin} install nodejs lts`, {
      silent: false,
      env: asdfEnv,
    });

    if (!installResult.success) {
      logger.error('Failed to install Node.js');
      return false;
    }

    // Set as global default
    logger.info('Setting Node.js LTS as global default...');
    const setResult = await shell.exec(`${asdfBin} global nodejs lts`, {
      silent: false,
      env: asdfEnv,
    });

    if (setResult.success) {
      logger.success('Node.js LTS installed and set as default');
      return true;
    } else {
      logger.error('Failed to set Node.js as global default');
      return false;
    }
  } catch (error) {
    logger.error(`Failed to install Node.js with asdf: ${error}`);
    return false;
  }
};
