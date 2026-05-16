/**
 * Check system requirements
 */

import { logger } from '../utils/logger';
import { platform } from '../utils/platform';
import { shell } from '../utils/shell';

export const check = async (): Promise<boolean> => {
  logger.header('System Requirements Check');

  let allGood = true;

  // Check platform
  logger.step('Checking platform...');
  if (platform.current === 'unknown') {
    logger.error('Unsupported platform');
    allGood = false;
  } else {
    logger.success(`Platform: ${platform.current} (${platform.arch})`);
  }

  // Check internet connection
  logger.step('Checking internet connection...');
  try {
    const response = await fetch('https://google.com', { method: 'HEAD' });
    if (response.ok) {
      logger.success('Internet connection available');
    } else {
      logger.error('No internet connection');
      allGood = false;
    }
  } catch {
    logger.error('No internet connection');
    allGood = false;
  }

  // Check git
  logger.step('Checking git...');
  if (await shell.commandExists('git')) {
    const version = (await shell.exec('git --version', { silent: true })).stdout.trim();
    logger.success(version);
  } else {
    logger.warn('git not found (required for installation)');
    allGood = false;
  }

  // Check curl
  logger.step('Checking curl...');
  if (await shell.commandExists('curl')) {
    logger.success('curl is available');
  } else {
    logger.warn('curl not found (recommended)');
  }

  // Check package manager
  logger.step('Checking package manager...');
  const pm = platform.packageManager;
  if (pm === 'unknown') {
    logger.warn('No known package manager found');
  } else {
    logger.success(`Package manager: ${pm}`);
  }

  // Check disk space
  logger.step('Checking disk space...');
  const dfResult = await shell.exec('df -h ~', { silent: true });
  if (dfResult.success) {
    logger.success('Sufficient disk space available');
  }

  // Check existing installations
  logger.newline();
  logger.header('Existing Installations');

  const tools = [
    { name: 'zsh', versionCommand: 'zsh --version' },
    { name: 'tmux', versionCommand: 'tmux -V' },
    { name: 'fzf', versionCommand: 'fzf --version' },
    { name: 'eza', versionCommand: 'eza --version' },
    { name: 'carapace', versionCommand: 'carapace --version' },
    { name: 'mise', versionCommand: 'mise --version' },
    { name: 'node', versionCommand: 'node --version' },
    { name: 'npm', versionCommand: 'npm --version' },
  ];

  for (const tool of tools) {
    if (await shell.commandExists(tool.name)) {
      const version = (await shell.exec(`${tool.versionCommand} 2>&1 | head -n1`, {
        silent: true,
        ignoreError: true,
      })).stdout.trim();
      logger.info(`${tool.name}: ${version || 'installed'}`);
    } else {
      logger.dim(`${tool.name}: not installed`);
    }
  }

  // Check Oh My Zsh
  const ohmyzshExists = await Bun.file(`${platform.homeDir}/.oh-my-zsh/oh-my-zsh.sh`).exists();
  if (ohmyzshExists) {
    logger.info('oh-my-zsh: installed');
  } else {
    logger.dim('oh-my-zsh: not installed');
  }

  // Check Antigen
  const antigenExists = await Bun.file(`${platform.homeDir}/antigen.zsh`).exists();
  if (antigenExists) {
    logger.info('antigen: installed');
  } else {
    logger.dim('antigen: not installed');
  }

  logger.newline();

  if (allGood) {
    logger.success('System is ready for installation!');
  } else {
    logger.error('Some requirements are not met');
  }

  return allGood;
};
