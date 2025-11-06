/**
 * Configuration file writer with backup support
 */

import { platform } from '../utils/platform';
import { logger } from '../utils/logger';
import { zshrcTemplate } from './templates/zshrc';
import { antigenrcTemplate } from './templates/antigenrc';
import { tmuxConfTemplate } from './templates/tmux.conf';
import { ezaTokyonightTemplate } from './templates/eza-tokyonight';

export interface BackupResult {
  success: boolean;
  backupDir?: string;
  files: string[];
}

export const configWriter = {
  /**
   * Get backup directory with timestamp
   */
  getBackupDir: (): string => {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/T/, '-')
      .replace(/\..+/, '')
      .replace(/:/g, '');
    return `${platform.homeDir}/.better-terminal-backups/${timestamp}`;
  },

  /**
   * Backup existing config files
   */
  backup: async (skipBackup = false): Promise<BackupResult> => {
    if (skipBackup) {
      logger.info('Skipping backup (--skip-backup flag)');
      return { success: true, files: [] };
    }

    const backupDir = configWriter.getBackupDir();
    const filesToBackup = [
      `${platform.homeDir}/.zshrc`,
      `${platform.homeDir}/.antigenrc`,
      `${platform.homeDir}/.tmux.conf`,
      `${platform.homeDir}/.config/eza/tokyonight.yml`,
    ];

    const backedUp: string[] = [];

    try {
      // Create backup directory
      await Bun.write(`${backupDir}/.keep`, '');

      // Backup each file if it exists
      for (const file of filesToBackup) {
        const fileHandle = Bun.file(file);
        if (await fileHandle.exists()) {
          const content = await fileHandle.text();
          const backupPath = file.replace(platform.homeDir, backupDir);

          // Create parent directories
          const dirPath = backupPath.substring(0, backupPath.lastIndexOf('/'));
          await Bun.write(`${dirPath}/.keep`, '');

          await Bun.write(backupPath, content);
          backedUp.push(file);
        }
      }

      if (backedUp.length > 0) {
        logger.success(`Backed up ${backedUp.length} files to ${backupDir}`);
      } else {
        logger.info('No existing config files to backup');
      }

      return { success: true, backupDir, files: backedUp };
    } catch (error) {
      logger.error(`Failed to backup configs: ${error}`);
      return { success: false, files: [] };
    }
  },

  /**
   * Write all configuration files
   */
  writeConfigs: async (): Promise<boolean> => {
    try {
      // Write .zshrc
      await Bun.write(`${platform.homeDir}/.zshrc`, zshrcTemplate);
      logger.success('Written ~/.zshrc');

      // Write .antigenrc
      await Bun.write(`${platform.homeDir}/.antigenrc`, antigenrcTemplate);
      logger.success('Written ~/.antigenrc');

      // Write .tmux.conf
      await Bun.write(`${platform.homeDir}/.tmux.conf`, tmuxConfTemplate);
      logger.success('Written ~/.tmux.conf');

      // Write eza config
      const ezaConfigDir = `${platform.homeDir}/.config/eza`;
      await Bun.write(`${ezaConfigDir}/.keep`, ''); // Create directory
      await Bun.write(`${ezaConfigDir}/tokyonight.yml`, ezaTokyonightTemplate);
      logger.success('Written ~/.config/eza/tokyonight.yml');

      return true;
    } catch (error) {
      logger.error(`Failed to write configs: ${error}`);
      return false;
    }
  },

  /**
   * Restore from backup
   */
  restore: async (backupDir: string): Promise<boolean> => {
    try {
      const files = [
        '.zshrc',
        '.antigenrc',
        '.tmux.conf',
        '.config/eza/tokyonight.yml',
      ];

      for (const file of files) {
        const backupPath = `${backupDir}/${file}`;
        const targetPath = `${platform.homeDir}/${file}`;

        const backupFile = Bun.file(backupPath);
        if (await backupFile.exists()) {
          const content = await backupFile.text();
          await Bun.write(targetPath, content);
          logger.success(`Restored ${file}`);
        }
      }

      return true;
    } catch (error) {
      logger.error(`Failed to restore configs: ${error}`);
      return false;
    }
  },
};
