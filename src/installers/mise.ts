/**
 * mise version manager installer.
 */

import { shell } from '../utils/shell';
import { logger } from '../utils/logger';
import { platform } from '../utils/platform';
import { installPackages } from '../utils/package-manager';

const getMiseInstallPath = (): string => `${platform.homeDir}/.local/bin/mise`;
const safeUserNamePattern = /^[a-zA-Z_][a-zA-Z0-9_-]*[$]?$/;

const getMiseCommand = async (): Promise<string | undefined> => {
  if (await shell.commandExists('mise')) return 'mise';

  const misePath = getMiseInstallPath();
  if (await Bun.file(misePath).exists()) return misePath;

  return undefined;
};

const fixMiseOwnership = async (): Promise<void> => {
  const sudoUser = process.env.SUDO_USER;
  if (!sudoUser || !safeUserNamePattern.test(sudoUser)) return;

  await shell.exec(
    `chown -R ${sudoUser} ${platform.homeDir}/.local ${platform.homeDir}/.config/mise`,
    { silent: true, ignoreError: true }
  );
};

export const installMise = async (): Promise<boolean> => {
  logger.step('Installing mise...');

  if (await getMiseCommand()) {
    logger.info('mise is already installed');
    return true;
  }

  if (platform.isMac()) {
    const result = await shell.exec('brew install mise', { silent: false });
    if (result.success) {
      logger.success('mise installed successfully');
      return true;
    }
  }

  if (platform.isLinux()) {
    const packageInstallSucceeded = await installPackages(['mise'], {
      silent: false,
      ignoreError: true,
    });

    if (packageInstallSucceeded && (await getMiseCommand())) {
      logger.success('mise installed successfully');
      return true;
    }

    logger.info('Installing mise with mise.run...');
    const installPath = getMiseInstallPath();
    const result = await shell.exec('curl -fsSL https://mise.run | sh', {
      silent: false,
      env: {
        HOME: platform.homeDir,
        MISE_INSTALL_PATH: installPath,
        MISE_INSTALL_HELP: '0',
      },
    });

    if (result.success && (await Bun.file(installPath).exists())) {
      await fixMiseOwnership();
      logger.success('mise installed successfully');
      return true;
    }
  }

  logger.error('Failed to install mise');
  return false;
};

export const installNodeWithMise = async (): Promise<boolean> => {
  logger.step('Installing Node.js LTS with mise...');

  const miseCommand = await getMiseCommand();
  if (!miseCommand) {
    logger.error('mise is not installed');
    return false;
  }

  const miseEnv = {
    PATH: `${platform.homeDir}/.local/bin:${process.env.PATH}`,
    HOME: platform.homeDir,
  };

  const result = await shell.exec(`${miseCommand} use --global node@lts`, {
    silent: false,
    env: miseEnv,
  });

  if (result.success) {
    await fixMiseOwnership();
    logger.success('Node.js LTS installed and set as global default');
    return true;
  }

  logger.error('Failed to install Node.js with mise');
  return false;
};
