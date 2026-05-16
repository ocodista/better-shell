import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts';
import pc from 'picocolors';
import { backup } from '../commands/backup';
import { check } from '../commands/check';
import { install, type InstallFeatures, type InstallOptions } from '../commands/install';
import { restore } from '../commands/restore';
import { logger } from '../utils/logger';

type ControlCenterChoice = 'install' | 'customize' | 'check' | 'backup' | 'restore' | 'guide' | 'exit';
type InstallProfile = 'full' | 'minimal' | 'custom';
type FeatureChoice = 'fonts' | 'fzf' | 'eza' | 'carapace' | 'runtime' | 'tmux';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isInteractiveTerminal = (): boolean => Boolean(process.stdin.isTTY && process.stdout.isTTY);

const stopWithCancel = (): false => {
  cancel('Cancelled');
  return false;
};

const showIntro = (): void => {
  intro(`${pc.bgCyan(pc.black(' better-shell '))} ${pc.dim('terminal control center')}`);
};

const buildFeaturesFromChoices = (choices: FeatureChoice[]): InstallFeatures => {
  const selected = new Set<FeatureChoice>(choices);

  return {
    fonts: selected.has('fonts'),
    fzf: selected.has('fzf'),
    eza: selected.has('eza'),
    carapace: selected.has('carapace'),
    mise: selected.has('runtime'),
    node: selected.has('runtime'),
    tmux: selected.has('tmux'),
  };
};

const describeInstallPlan = (options: InstallOptions): string => {
  const profile = options.minimal ? 'Minimal' : options.features ? 'Custom' : 'Full';
  const backupText = options.skipBackup ? 'No backup' : 'Backup enabled';
  const mode = options.dryRun ? 'Preview only' : 'Install changes';

  return [
    `${pc.bold('Profile:')} ${profile}`,
    `${pc.bold('Safety:')} ${backupText}`,
    `${pc.bold('Mode:')} ${mode}`,
  ].join('\n');
};

const askInstallProfile = async (initialProfile?: InstallProfile): Promise<InstallProfile | false> => {
  if (initialProfile) return initialProfile;

  const profile = await select<InstallProfile>({
    message: 'How do you want to set up this terminal?',
    initialValue: 'full',
    options: [
      {
        value: 'full',
        label: 'Full setup',
        hint: 'zsh, plugins, fzf, eza, carapace, mise, Node.js, tmux, font',
      },
      {
        value: 'minimal',
        label: 'Minimal setup',
        hint: 'core shell setup without optional font or carapace',
      },
      {
        value: 'custom',
        label: 'Custom setup',
        hint: 'choose each feature',
      },
    ],
  });

  if (isCancel(profile)) return stopWithCancel();
  return profile;
};

const askCustomFeatures = async (): Promise<InstallFeatures | false> => {
  const choices = await multiselect<FeatureChoice>({
    message: 'Choose what Better Shell should manage',
    required: true,
    initialValues: ['fonts', 'fzf', 'eza', 'carapace', 'runtime', 'tmux'],
    options: [
      { value: 'fzf', label: 'fzf history search', hint: 'Ctrl+R fuzzy history' },
      { value: 'eza', label: 'eza file listing', hint: 'modern ls with icons' },
      { value: 'carapace', label: 'carapace completions', hint: 'smart completions for many CLIs' },
      { value: 'runtime', label: 'mise + Node.js LTS', hint: 'modern replacement for asdf' },
      { value: 'tmux', label: 'tmux sessions', hint: 'panes, persisted sessions, plugins' },
      { value: 'fonts', label: 'FiraCode Nerd Font', hint: 'icons and ligatures' },
    ],
  });

  if (isCancel(choices)) return stopWithCancel();
  return buildFeaturesFromChoices(choices);
};

export const runInstallWizard = async (
  initialProfile?: InstallProfile,
  showHeader = true
): Promise<boolean> => {
  if (!isInteractiveTerminal()) {
    logger.error('Interactive setup requires a TTY. Run `better-shell install` for non-interactive installs.');
    return false;
  }

  if (showHeader) showIntro();

  const profile = await askInstallProfile(initialProfile);
  if (!profile) return false;

  const shouldBackup = await confirm({
    message: 'Back up existing shell configs before writing new ones?',
    initialValue: true,
  });
  if (isCancel(shouldBackup)) return stopWithCancel();

  const dryRun = await confirm({
    message: 'Preview the plan without changing files?',
    initialValue: false,
    active: 'Preview only',
    inactive: 'Install now',
  });
  if (isCancel(dryRun)) return stopWithCancel();

  const features = profile === 'custom' ? await askCustomFeatures() : undefined;
  if (features === false) return false;

  const options: InstallOptions = {
    skipBackup: !shouldBackup,
    dryRun,
    minimal: profile === 'minimal',
    features,
  };

  note(describeInstallPlan(options), 'Install plan');

  const proceed = await confirm({
    message: dryRun ? 'Show this preview?' : 'Start installation?',
    initialValue: true,
  });
  if (isCancel(proceed)) return stopWithCancel();
  if (!proceed) return stopWithCancel();

  const loading = spinner();
  loading.start('Preparing terminal setup plan');
  await sleep(350);
  loading.stop('Plan ready');

  const success = await install(options);

  if (success) {
    outro(pc.green('Better Shell is ready. Restart your terminal or run `exec zsh`.'));
  } else {
    outro(pc.red('Setup did not complete. Check the messages above.'));
  }

  return success;
};

const runBackupFlow = async (): Promise<boolean> => {
  const loading = spinner();
  loading.start('Preparing backup');
  await sleep(250);
  loading.stop('Backup command ready');
  return backup();
};

const runRestoreFlow = async (): Promise<boolean> => {
  const backupPath = await text({
    message: 'Backup path to restore',
    placeholder: '~/.better-shell-backups/YYYY-MM-DD-HHMMSS',
    validate(value) {
      if (!value?.trim()) return 'Enter a backup path.';
      return undefined;
    },
  });

  if (isCancel(backupPath)) return stopWithCancel();
  return restore(backupPath.trim());
};

const showGuide = (): void => {
  note(
    [
      `${pc.bold('Config files')}`,
      '• ~/.zshrc',
      '• ~/.antigenrc',
      '• ~/.tmux.conf',
      '• ~/.config/eza/tokyonight.yml',
      '',
      `${pc.bold('Useful commands')}`,
      '• better-shell check',
      '• better-shell install --dry-run',
      '• better-shell backup',
      '• better-shell restore <backup-path>',
    ].join('\n'),
    'Configuration guide'
  );
};

export const runControlCenter = async (): Promise<boolean> => {
  if (!isInteractiveTerminal()) {
    logger.info('Interactive control center requires a TTY. Run `better-shell --help` for commands.');
    return true;
  }

  showIntro();

  while (true) {
    const choice = await select<ControlCenterChoice>({
      message: 'What do you want to do?',
      options: [
        { value: 'install', label: 'Install or update Better Shell', hint: 'guided full setup' },
        { value: 'customize', label: 'Customize this terminal', hint: 'choose managed features' },
        { value: 'check', label: 'Run health check', hint: 'requirements and installed tools' },
        { value: 'backup', label: 'Back up configs', hint: 'save current shell configs' },
        { value: 'restore', label: 'Restore configs', hint: 'recover a previous backup' },
        { value: 'guide', label: 'Show configuration guide', hint: 'files and commands' },
        { value: 'exit', label: 'Exit' },
      ],
    });

    if (isCancel(choice)) return stopWithCancel();

    switch (choice) {
      case 'install':
        return runInstallWizard('full', false);
      case 'customize':
        return runInstallWizard('custom', false);
      case 'check':
        await check();
        break;
      case 'backup':
        await runBackupFlow();
        break;
      case 'restore':
        await runRestoreFlow();
        break;
      case 'guide':
        showGuide();
        break;
      case 'exit':
        outro('Bye.');
        return true;
    }
  }
};
