#!/usr/bin/env bun

/**
 * better-terminal CLI
 * One-command terminal setup with zsh, oh-my-zsh, fzf, asdf, tmux, and more
 */

import { parseArgs } from 'node:util';
import { logger } from './utils/logger';
import { install } from './commands/install';
import { check } from './commands/check';
import { backup } from './commands/backup';
import { restore } from './commands/restore';

const VERSION = '1.0.0';

function getHelpText(): string {
  // Use plain ANSI codes for better compatibility in compiled executable
  const bright = '\x1b[1m';
  const reset = '\x1b[0m';
  const cyan = '\x1b[36m';
  const dim = '\x1b[2m';

  return `
${bright}better-terminal${reset} v${VERSION}

One-command terminal setup with zsh, oh-my-zsh, fzf, asdf, tmux, and more.

${bright}USAGE:${reset}
  better-terminal <command> [options]

${bright}COMMANDS:${reset}
  ${cyan}install${reset}               Install and configure everything
  ${cyan}check${reset}                 Check system requirements
  ${cyan}backup${reset} [destination]  Backup existing configurations
  ${cyan}restore${reset} <backup-path> Restore from backup

${bright}OPTIONS:${reset}
  --skip-backup         Skip configuration backup
  --dry-run            Preview installation without making changes
  --interactive        Ask before each step (coming soon)
  --minimal            Install only essentials
  --version, -v        Show version
  --help, -h           Show this help

${bright}EXAMPLES:${reset}
  better-terminal install
  better-terminal install --skip-backup
  better-terminal install --dry-run
  better-terminal check
  better-terminal backup
  better-terminal backup ~/my-backups
  better-terminal restore ~/.better-terminal-backups/2024-01-01-120000

${bright}FEATURES:${reset}
  ✓ Auto-suggestions as you type
  ✓ Blazingly fast history search (Ctrl+R via fzf)
  ✓ Syntax highlighting
  ✓ Modern ls with icons (eza)
  ✓ Version management (asdf with Node.js LTS)
  ✓ Terminal multiplexing (tmux with saved sessions)
  ✓ FiraCode Nerd Font
  ✓ TokyoNight theme
  ✓ Smart directory jumping

${dim}Made with Bun v1.3${reset}
`;
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      'skip-backup': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      interactive: { type: 'boolean' },
      minimal: { type: 'boolean' },
    },
    allowPositionals: true,
  });

  // Show help
  if (values.help || args.length === 0) {
    console.log(getHelpText());
    process.exit(0);
  }

  // Show version
  if (values.version) {
    console.log(`better-terminal v${VERSION}`);
    process.exit(0);
  }

  const command = positionals[0];

  try {
    switch (command) {
      case 'install': {
        const success = await install({
          skipBackup: values['skip-backup'] as boolean,
          dryRun: values['dry-run'] as boolean,
          interactive: values.interactive as boolean,
          minimal: values.minimal as boolean,
        });
        process.exit(success ? 0 : 1);
      }

      case 'check': {
        const success = await check();
        process.exit(success ? 0 : 1);
      }

      case 'backup': {
        const destination = positionals[1];
        const success = await backup(destination);
        process.exit(success ? 0 : 1);
      }

      case 'restore': {
        const backupPath = positionals[1];
        if (!backupPath) {
          logger.error('Backup path is required');
          logger.info('Usage: better-terminal restore <backup-path>');
          process.exit(1);
        }
        const success = await restore(backupPath);
        process.exit(success ? 0 : 1);
      }

      default:
        logger.error(`Unknown command: ${command}`);
        logger.info('Run "better-terminal --help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    logger.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

main();
