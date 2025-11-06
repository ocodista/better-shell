/**
 * Backup existing configurations
 */

import { logger } from '../utils/logger';
import { configWriter } from '../configs/writer';

export const backup = async (destination?: string): Promise<boolean> => {
  logger.header('Backing Up Configurations');

  if (destination) {
    logger.info(`Custom backup location: ${destination}`);
    // TODO: Implement custom destination backup
    logger.warn('Custom destination not yet implemented, using default location');
  }

  const result = await configWriter.backup(false);

  if (result.success) {
    if (result.files.length > 0) {
      logger.newline();
      logger.success(`Backup completed: ${result.backupDir}`);
      logger.info(`Backed up ${result.files.length} files:`);
      result.files.forEach((file) => logger.dim(`  - ${file}`));
    } else {
      logger.info('No configuration files to backup');
    }
    return true;
  } else {
    logger.error('Backup failed');
    return false;
  }
};
