/**
 * Main installation command.
 */

import { logger } from '../utils/logger';
import { platform } from '../utils/platform';
import { shell } from '../utils/shell';
import { configWriter } from '../configs/writer';
import { installZsh, setZshAsDefault } from '../installers/zsh';
import { installOhMyZsh } from '../installers/oh-my-zsh';
import { installAntigen } from '../installers/antigen';
import { installFzf } from '../installers/fzf';
import { installMise, installNodeWithMise } from '../installers/mise';
import { installTmux, installTpm } from '../installers/tmux';
import { installFiraCode } from '../installers/fonts';
import { installEza } from '../installers/eza';
import { installCarapace } from '../installers/carapace';

export interface InstallFeatures {
  fonts: boolean;
  fzf: boolean;
  eza: boolean;
  carapace: boolean;
  mise: boolean;
  node: boolean;
  tmux: boolean;
}

export interface InstallOptions {
  skipBackup?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
  minimal?: boolean;
  features?: Partial<InstallFeatures>;
}

const defaultFeatures: InstallFeatures = {
  fonts: true,
  fzf: true,
  eza: true,
  carapace: true,
  mise: true,
  node: true,
  tmux: true,
};

export const resolveInstallFeatures = (options: InstallOptions = {}): InstallFeatures => {
  const features = { ...defaultFeatures };

  if (options.minimal) {
    features.fonts = false;
    features.carapace = false;
  }

  return { ...features, ...options.features };
};

const getDryRunSteps = (features: InstallFeatures, skipBackup: boolean): string[] => {
  const steps = [
    !skipBackup ? 'Backup existing configurations' : undefined,
    'Install zsh',
    'Install Oh My Zsh',
    'Install Antigen',
    features.fonts ? 'Install FiraCode Nerd Font' : undefined,
    features.fzf ? 'Install fzf' : undefined,
    features.eza ? 'Install eza' : undefined,
    features.carapace ? 'Install carapace' : undefined,
    features.mise ? 'Install mise' : undefined,
    features.mise && features.node ? 'Install Node.js LTS via mise' : undefined,
    features.tmux ? 'Install tmux' : undefined,
    features.tmux ? 'Install TPM' : undefined,
    'Write configuration files',
    'Set zsh as default shell',
  ];

  return steps.filter((step): step is string => Boolean(step));
};

export const install = async (options: InstallOptions = {}): Promise<boolean> => {
  const { skipBackup = false, dryRun = false } = options;
  const features = resolveInstallFeatures(options);

  logger.header('🚀 Better Shell Installation');

  if (dryRun) {
    logger.warn('DRY RUN MODE - No changes will be made');
    logger.newline();
  }

  if (shell.isRoot()) {
    const sudoUser = process.env.SUDO_USER;
    if (sudoUser) {
      logger.info(`Installing for user: ${sudoUser}`);
    } else {
      logger.warn('Running as root. Config files will be installed to /root.');
      logger.info('To install for a specific user, run: sudo -u username better-shell install');
    }
    logger.newline();
  }

  logger.info(`Platform: ${platform.current} (${platform.arch})`);
  logger.info(`Home: ${platform.homeDir}`);
  logger.newline();

  if (dryRun) {
    logger.info('Installation steps that would be performed:');
    getDryRunSteps(features, skipBackup).forEach((step, index) => {
      logger.dim(`${index + 1}. ${step}`);
    });
    logger.newline();
    logger.info('Run without --dry-run to perform installation');
    return true;
  }

  if (!skipBackup) {
    logger.header('Step 1: Backup');
    const backupResult = await configWriter.backup(skipBackup);
    if (!backupResult.success) {
      logger.error('Backup failed. Aborting installation.');
      return false;
    }
    logger.newline();
  }

  logger.header('Step 2: Installing Base Tools');

  if (!(await installZsh())) {
    logger.error('Failed to install zsh. Aborting.');
    return false;
  }

  if (!(await installOhMyZsh())) {
    logger.error('Failed to install Oh My Zsh. Aborting.');
    return false;
  }

  if (!(await installAntigen())) {
    logger.error('Failed to install Antigen. Aborting.');
    return false;
  }

  logger.newline();

  if (features.fonts) {
    logger.header('Step 3: Installing Fonts');
    await installFiraCode();
    logger.newline();
  }

  logger.header('Step 4: Installing CLI Tools');

  if (features.fzf && !(await installFzf())) {
    logger.warn('Failed to install fzf, continuing...');
  }

  if (features.eza && !(await installEza())) {
    logger.warn('Failed to install eza, continuing...');
  }

  if (features.carapace) {
    await installCarapace();
  }

  logger.newline();

  if (features.mise) {
    logger.header('Step 5: Installing Version Manager');

    if (!(await installMise())) {
      logger.error('Failed to install mise. Aborting.');
      return false;
    }

    if (features.node && !(await installNodeWithMise())) {
      logger.warn('Failed to install Node.js, continuing...');
    }

    logger.newline();
  }

  if (features.tmux) {
    logger.header('Step 6: Installing Terminal Multiplexer');

    if (!(await installTmux())) {
      logger.warn('Failed to install tmux, continuing...');
    } else {
      await installTpm();
    }

    logger.newline();
  }

  logger.header('Step 7: Writing Configuration Files');

  if (!(await configWriter.writeConfigs({ tmux: features.tmux, eza: features.eza }))) {
    logger.error('Failed to write configuration files. Aborting.');
    return false;
  }

  logger.newline();

  logger.header('Step 8: Finalizing Installation');
  await setZshAsDefault();
  logger.newline();

  logger.header('✨ Installation Complete!');

  logger.success('Your terminal is now supercharged!');
  logger.newline();

  logger.info('Next steps:');
  logger.dim('1. Restart your terminal or run: exec zsh');
  if (features.tmux) logger.dim('2. Open tmux and run "prefix + I" to install tmux plugins');
  if (features.node) logger.dim('3. Verify Node.js installation: node --version');
  if (features.fonts) logger.dim('4. Configure your terminal to use FiraCode Nerd Font');
  logger.newline();

  logger.info('Installed features:');
  logger.dim('✓ Auto-suggestions (type and see suggestions)');
  logger.dim('✓ Syntax highlighting (colored commands)');
  if (features.fzf) logger.dim('✓ Fast history search (Ctrl+R)');
  logger.dim('✓ Smart directory jumping (z <directory>)');
  if (features.eza) logger.dim('✓ Modern ls with icons (lsx alias)');
  if (features.mise) logger.dim('✓ Tool version management (mise)');
  if (features.tmux) logger.dim('✓ Terminal multiplexing (tmux)');
  logger.newline();

  return true;
};
