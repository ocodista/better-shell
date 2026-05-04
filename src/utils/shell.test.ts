import { describe, expect, test } from 'bun:test';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getCommandExistsCommand,
  getShellCommandArgs,
  shell,
} from './shell';

const isWindows = process.platform === 'win32';

const currentDirectoryCommand = isWindows ? '(Get-Location).Path' : 'pwd';
const environmentCommand = isWindows
  ? 'Write-Output $env:BETTER_SHELL_TEST_VALUE'
  : 'printf "%s" "$BETTER_SHELL_TEST_VALUE"';
const quotedArgumentCommand = isWindows
  ? 'Write-Output "hello world"'
  : "printf '%s' 'hello world'";
const pipeCommand = isWindows
  ? '"hello" | ForEach-Object { $_.ToUpperInvariant() }'
  : "printf 'hello' | tr '[:lower:]' '[:upper:]'";

describe('shell command planning', () => {
  test('uses a POSIX shell on macOS and Linux', () => {
    expect(getShellCommandArgs('echo hello', 'linux')).toEqual(['/bin/sh', '-c', 'echo hello']);
    expect(getShellCommandArgs('echo hello', 'darwin')).toEqual(['/bin/sh', '-c', 'echo hello']);
  });

  test('uses PowerShell on Windows', () => {
    expect(getShellCommandArgs('Write-Output hello', 'win32')).toEqual([
      'powershell.exe',
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      'Write-Output hello',
    ]);
  });

  test('builds platform-specific command lookup checks', () => {
    expect(getCommandExistsCommand('git', 'linux')).toBe(
      "command -v 'git' >/dev/null 2>&1"
    );
    expect(getCommandExistsCommand('git', 'win32')).toContain("Get-Command 'git'");
  });

  test('rejects unsafe command names in lookup checks', () => {
    expect(getCommandExistsCommand('git; rm -rf /', 'linux')).toBeUndefined();
  });
});

describe('shell.exec', () => {
  test('executes valid commands', async () => {
    const result = await shell.exec('echo hello', { silent: true });

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
  });

  test('captures command output', async () => {
    const result = await shell.exec('echo test output', { silent: true });

    expect(result.stdout).toContain('test output');
  });

  test('preserves quoted arguments', async () => {
    const result = await shell.exec(quotedArgumentCommand, { silent: true });

    expect(result.success).toBe(true);
    expect(result.stdout.trim()).toBe('hello world');
  });

  test('supports shell pipelines', async () => {
    const result = await shell.exec(pipeCommand, { silent: true });

    expect(result.success).toBe(true);
    expect(result.stdout.trim()).toBe('HELLO');
  });

  test('fails on non-existent commands', async () => {
    const result = await shell.exec('this-command-does-not-exist-xyz', {
      silent: true,
      ignoreError: true,
    });

    expect(result.success).toBe(false);
    expect(result.exitCode).not.toBe(0);
  });

  test('respects working directory option', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'shell-cwd-test-'));

    try {
      const result = await shell.exec(currentDirectoryCommand, {
        cwd: tempDir,
        silent: true,
      });

      expect(result.success).toBe(true);
      expect(await realpath(result.stdout.trim())).toBe(await realpath(tempDir));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test('respects environment option', async () => {
    const result = await shell.exec(environmentCommand, {
      env: { BETTER_SHELL_TEST_VALUE: 'from-env' },
      silent: true,
    });

    expect(result.success).toBe(true);
    expect(result.stdout.trim()).toBe('from-env');
  });

  test('separates stdout from stderr', async () => {
    const result = await shell.exec("bun -e \"console.error('expected stderr'); process.exit(1)\"", {
      silent: true,
      ignoreError: true,
    });

    expect(result.success).toBe(false);
    expect(result.stderr).toContain('expected stderr');
  });
});

describe('shell.commandExists', () => {
  test('finds common system commands', async () => {
    const exists = await shell.commandExists('echo');

    expect(exists).toBe(true);
  });

  test('returns false for non-existent commands', async () => {
    const exists = await shell.commandExists('this-command-definitely-does-not-exist-xyz123');

    expect(exists).toBe(false);
  });

  test('returns false for unsafe command names', async () => {
    const exists = await shell.commandExists('echo; exit 0');

    expect(exists).toBe(false);
  });

  test('finds different commands consistently', async () => {
    const echoExists = await shell.commandExists('echo');
    const bunExists = await shell.commandExists('bun');

    expect(echoExists).toBe(true);
    expect(bunExists).toBe(true);
  });
});

describe('shell.execMany', () => {
  test('executes multiple commands successfully', async () => {
    const success = await shell.execMany(['echo first', 'echo second', 'echo third'], {
      silent: true,
    });

    expect(success).toBe(true);
  });

  test('stops on first failure by default', async () => {
    const success = await shell.execMany(
      ['echo success', 'this-will-fail-xyz', 'echo third'],
      { silent: true, ignoreError: false }
    );

    expect(success).toBe(false);
  });

  test('continues on errors when ignoreError is true', async () => {
    const success = await shell.execMany(
      ['echo first', 'this-will-fail-xyz', 'echo third'],
      { silent: true, ignoreError: true }
    );

    expect(success).toBe(true);
  });

  test('handles empty command list', async () => {
    const success = await shell.execMany([], { silent: true });

    expect(success).toBe(true);
  });
});

describe('shell.download', () => {
  test('returns boolean result', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'shell-test-'));
    const destination = join(tempDir, 'test.txt');

    try {
      const result = await shell.download(
        'https://invalid-domain-xyz123.test/file.txt',
        destination
      );

      expect(typeof result).toBe('boolean');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test('handles invalid URLs gracefully', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'shell-test-'));
    const destination = join(tempDir, 'fail-test.txt');

    try {
      const success = await shell.download('not-even-a-url', destination);

      expect(success).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe('shell.isRoot', () => {
  test('returns a boolean', () => {
    const isRoot = shell.isRoot();

    expect(typeof isRoot).toBe('boolean');
  });

  test('consistently returns the same value', () => {
    const first = shell.isRoot();
    const second = shell.isRoot();

    expect(first).toBe(second);
  });

  test('returns false for normal user', () => {
    const isRoot = shell.isRoot();

    if (process.getuid && process.getuid() !== 0) {
      expect(isRoot).toBe(false);
    }
  });
});
