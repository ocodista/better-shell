/**
 * Restore configurations from backup
 */

import { logger } from '../utils/logger';
import { configWriter } from '../configs/writer';

export const restore = async (backupPath: string): Promise<boolean> => {
  logger.header('Restoring Configurations');

  logger.info(`Restoring from: ${backupPath}`);

  const success = await configWriter.restore(backupPath);

  if (success) {
    logger.success('Configurations restored successfully');
    logger.info('Please restart your shell or run: source ~/.zshrc');
    return true;
  } else {
    logger.error('Failed to restore configurations');
    return false;
  }
};
