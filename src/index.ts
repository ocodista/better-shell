#!/usr/bin/env bun

/**
 * better-shell CLI
 * Terminal setup and management with zsh, Oh My Zsh, fzf, mise, tmux, and more.
 */

import { parseArgs } from 'node:util';
import { logger } from './utils/logger';
import { install, type InstallFeatures } from './commands/install';
import { check } from './commands/check';
import { backup } from './commands/backup';
import { restore } from './commands/restore';
import { runControlCenter, runInstallWizard } from './tui/control-center';

const VERSION = '1.0.0';

function getHelpText(): string {
  const bright = '\x1b[1m';
  const reset = '\x1b[0m';
  const cyan = '\x1b[36m';
  const dim = '\x1b[2m';

  return `
${bright}better-shell${reset} v${VERSION}

A terminal setup manager for zsh, completions, fuzzy search, mise, tmux, fonts, and config backups.

${bright}USAGE:${reset}
  better-shell [command] [options]

${bright}COMMANDS:${reset}
  ${cyan}manage${reset}                Open the interactive control center
  ${cyan}configure${reset}             Customize this terminal with a guided TUI
  ${cyan}install${reset}               Install and configure everything
  ${cyan}check${reset}                 Check system requirements and installed tools
  ${cyan}backup${reset} [destination]  Backup existing configurations
  ${cyan}restore${reset} <backup-path> Restore from backup

${bright}OPTIONS:${reset}
  --interactive        Use the guided TUI installer
  --skip-backup        Skip configuration backup
  --dry-run            Preview installation without making changes
  --minimal            Skip optional tools such as fonts and carapace
  --no-fonts           Skip FiraCode Nerd Font
  --no-fzf             Skip fzf
  --no-eza             Skip eza
  --no-carapace        Skip carapace completions
  --no-mise            Skip mise and Node.js setup
  --no-node            Skip Node.js LTS setup
  --no-tmux            Skip tmux and tmux plugins
  --version, -v        Show version
  --help, -h           Show this help

${bright}EXAMPLES:${reset}
  better-shell                       ${dim}# open control center${reset}
  better-shell configure             ${dim}# guided custom setup${reset}
  better-shell install --interactive
  better-shell install --dry-run
  better-shell install --minimal
  better-shell install --no-fonts --no-tmux
  better-shell check
  better-shell backup
  better-shell restore ~/.better-shell-backups/2024-01-01-120000

${bright}FEATURES:${reset}
  ✓ Guided control center with prompts and loading states
  ✓ Auto-suggestions and syntax highlighting
  ✓ Fast history search (Ctrl+R via fzf)
  ✓ Smart completions (carapace)
  ✓ Modern ls with icons (eza)
  ✓ Tool version management (mise with Node.js LTS)
  ✓ Terminal multiplexing (tmux with saved sessions)
  ✓ FiraCode Nerd Font and TokyoNight eza theme

${dim}Made with Bun v1.3${reset}
`;
}

const getFeatureOverrides = (values: Record<string, unknown>): Partial<InstallFeatures> | undefined => {
  const features: Partial<InstallFeatures> = {};

  if (values['no-fonts'] === true) features.fonts = false;
  if (values['no-fzf'] === true) features.fzf = false;
  if (values['no-eza'] === true) features.eza = false;
  if (values['no-carapace'] === true) features.carapace = false;
  if (values['no-mise'] === true) {
    features.mise = false;
    features.node = false;
  }
  if (values['no-node'] === true) features.node = false;
  if (values['no-tmux'] === true) features.tmux = false;

  return Object.keys(features).length > 0 ? features : undefined;
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const success = await runControlCenter();
    process.exit(success ? 0 : 1);
  }

  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      'skip-backup': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      interactive: { type: 'boolean' },
      minimal: { type: 'boolean' },
      'no-fonts': { type: 'boolean' },
      'no-fzf': { type: 'boolean' },
      'no-eza': { type: 'boolean' },
      'no-carapace': { type: 'boolean' },
      'no-mise': { type: 'boolean' },
      'no-node': { type: 'boolean' },
      'no-tmux': { type: 'boolean' },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(getHelpText());
    process.exit(0);
  }

  if (values.version) {
    console.log(`better-shell v${VERSION}`);
    process.exit(0);
  }

  const command = positionals[0];

  try {
    switch (command) {
      case 'manage': {
        const success = await runControlCenter();
        process.exit(success ? 0 : 1);
      }

      case 'configure': {
        const success = await runInstallWizard('custom');
        process.exit(success ? 0 : 1);
      }

      case 'install': {
        if (values.interactive === true) {
          const profile = values.minimal === true ? 'minimal' : undefined;
          const success = await runInstallWizard(profile);
          process.exit(success ? 0 : 1);
        }

        const success = await install({
          skipBackup: values['skip-backup'] === true,
          dryRun: values['dry-run'] === true,
          minimal: values.minimal === true,
          features: getFeatureOverrides(values),
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
          logger.info('Usage: better-shell restore <backup-path>');
          process.exit(1);
        }
        const success = await restore(backupPath);
        process.exit(success ? 0 : 1);
      }

      default:
        logger.error(`Unknown command: ${command}`);
        logger.info('Run "better-shell --help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    logger.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

main();
