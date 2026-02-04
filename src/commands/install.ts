/**
 * Main installation command
 */

import { logger } from '../utils/logger';
import { platform } from '../utils/platform';
import { shell } from '../utils/shell';
import { configWriter } from '../configs/writer';
import { installZsh, setZshAsDefault } from '../installers/zsh';
import { installOhMyZsh } from '../installers/oh-my-zsh';
import { installAntigen } from '../installers/antigen';
import { installFzf } from '../installers/fzf';
import { installAsdf, installNodeWithAsdf } from '../installers/asdf';
import { installTmux, installTpm } from '../installers/tmux';
import { installFiraCode } from '../installers/fonts';
import { installEza } from '../installers/eza';
import { installCarapace } from '../installers/carapace';

export interface InstallOptions {
  skipBackup?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
  minimal?: boolean;
}

export const install = async (options: InstallOptions = {}): Promise<boolean> => {
  const { skipBackup = false, dryRun = false, minimal = false } = options;

  logger.header('🚀 Better Terminal Installation');

  if (dryRun) {
    logger.warn('DRY RUN MODE - No changes will be made');
    logger.newline();
  }

  // Check if running as root (expected when using sudo)
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

  // Platform info
  logger.info(`Platform: ${platform.current} (${platform.arch})`);
  logger.info(`Home: ${platform.homeDir}`);
  logger.newline();

  if (dryRun) {
    logger.info('Installation steps that would be performed:');
    logger.dim('1. Backup existing configurations');
    logger.dim('2. Install zsh');
    logger.dim('3. Install Oh My Zsh');
    logger.dim('4. Install Antigen');
    logger.dim('5. Install FiraCode Nerd Font');
    logger.dim('6. Install fzf');
    logger.dim('7. Install eza');
    logger.dim('8. Install carapace');
    logger.dim('9. Install asdf');
    logger.dim('10. Install Node.js LTS via asdf');
    logger.dim('11. Install tmux');
    logger.dim('12. Install TPM');
    logger.dim('13. Write configuration files');
    logger.dim('14. Set zsh as default shell');
    logger.newline();
    logger.info('Run without --dry-run to perform installation');
    return true;
  }

  // Step 1: Backup
  if (!skipBackup) {
    logger.header('Step 1: Backup');
    const backupResult = await configWriter.backup(skipBackup);
    if (!backupResult.success) {
      logger.error('Backup failed. Aborting installation.');
      return false;
    }
    logger.newline();
  }

  // Step 2: Install base tools
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

  // Step 3: Install fonts
  if (!minimal) {
    logger.header('Step 3: Installing Fonts');
    await installFiraCode(); // Non-critical
    logger.newline();
  }

  // Step 4: Install CLI tools
  logger.header('Step 4: Installing CLI Tools');

  if (!(await installFzf())) {
    logger.warn('Failed to install fzf, continuing...');
  }

  if (!(await installEza())) {
    logger.warn('Failed to install eza, continuing...');
  }

  if (!minimal) {
    await installCarapace(); // Non-critical
  }

  logger.newline();

  // Step 5: Install package managers
  logger.header('Step 5: Installing Package Managers');

  if (!(await installAsdf())) {
    logger.error('Failed to install asdf. Aborting.');
    return false;
  }

  if (!(await installNodeWithAsdf())) {
    logger.warn('Failed to install Node.js, continuing...');
  }

  logger.newline();

  // Step 6: Install terminal multiplexer
  logger.header('Step 6: Installing Terminal Multiplexer');

  if (!(await installTmux())) {
    logger.warn('Failed to install tmux, continuing...');
  } else {
    await installTpm(); // Non-critical
  }

  logger.newline();

  // Step 7: Write configurations
  logger.header('Step 7: Writing Configuration Files');

  if (!(await configWriter.writeConfigs())) {
    logger.error('Failed to write configuration files. Aborting.');
    return false;
  }

  logger.newline();

  // Step 8: Set zsh as default
  logger.header('Step 8: Finalizing Installation');

  await setZshAsDefault(); // Non-critical

  logger.newline();

  // Success!
  logger.header('✨ Installation Complete!');

  logger.success('Your terminal is now supercharged!');
  logger.newline();

  logger.info('Next steps:');
  logger.dim('1. Restart your terminal or run: exec zsh');
  logger.dim('2. Open tmux and run "prefix + I" to install tmux plugins');
  logger.dim('3. Verify Node.js installation: node --version');
  logger.dim('4. Configure your terminal to use FiraCode Nerd Font');
  logger.newline();

  logger.info('Installed features:');
  logger.dim('✓ Auto-suggestions (type and see suggestions)');
  logger.dim('✓ Syntax highlighting (colored commands)');
  logger.dim('✓ Blazingly fast search (Ctrl+R)');
  logger.dim('✓ Smart directory jumping (z <directory>)');
  logger.dim('✓ Modern ls with icons (lsx alias)');
  logger.dim('✓ Package version management (asdf)');
  logger.dim('✓ Terminal multiplexing (tmux)');
  logger.newline();

  return true;
};
