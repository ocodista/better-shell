/**
 * Shell command execution utilities
 */

import { logger } from './logger';

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  silent?: boolean;
  ignoreError?: boolean;
}

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

const commandNamePattern = /^[a-zA-Z0-9._+/-]+$/;

export const getShellCommandArgs = (
  command: string,
  currentPlatform: string = process.platform
): string[] => {
  if (currentPlatform === 'win32') {
    return [
      'powershell.exe',
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      command,
    ];
  }

  return ['/bin/sh', '-c', command];
};

export const getCommandExistsCommand = (
  command: string,
  currentPlatform: string = process.platform
): string | undefined => {
  if (!commandNamePattern.test(command)) return undefined;

  if (currentPlatform === 'win32') {
    return `if (Get-Command '${command}' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }`;
  }

  return `command -v '${command}' >/dev/null 2>&1`;
};

export const shell = {
  /**
   * Execute a shell command
   */
  exec: async (command: string, options: ExecOptions = {}): Promise<ExecResult> => {
    const { cwd, env, silent = false, ignoreError = false } = options;

    if (!silent) {
      logger.dim(`$ ${command}`);
    }

    try {
      const proc = Bun.spawn(getShellCommandArgs(command), {
        cwd: cwd || process.cwd(),
        env: { ...process.env, ...env },
        stdout: 'pipe',
        stderr: 'pipe',
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      const success = exitCode === 0;

      if (!success && !ignoreError && !silent) {
        logger.error(`Command failed: ${command}`);
        if (stderr) logger.error(stderr);
      }

      return { success, stdout, stderr, exitCode };
    } catch (error) {
      if (!ignoreError && !silent) {
        logger.error(`Failed to execute: ${command}`);
        logger.error(String(error));
      }
      return {
        success: false,
        stdout: '',
        stderr: String(error),
        exitCode: 1,
      };
    }
  },

  /**
   * Execute multiple commands sequentially
   */
  execMany: async (commands: string[], options: ExecOptions = {}): Promise<boolean> => {
    for (const cmd of commands) {
      const result = await shell.exec(cmd, options);
      if (!result.success && !options.ignoreError) {
        return false;
      }
    }
    return true;
  },

  /**
   * Check if a command exists
   */
  commandExists: async (command: string): Promise<boolean> => {
    const lookupCommand = getCommandExistsCommand(command);
    if (!lookupCommand) return false;

    const result = await shell.exec(lookupCommand, { silent: true, ignoreError: true });
    return result.success;
  },

  /**
   * Download a file
   */
  download: async (url: string, destination: string): Promise<boolean> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return false;

      const data = await response.arrayBuffer();
      await Bun.write(destination, data);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if running with sudo/root
   */
  isRoot: (): boolean => {
    return process.getuid?.() === 0;
  },
};
