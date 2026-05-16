#!/usr/bin/env bun

/**
 * Build script using Bun v1.3.1 with Bun Shell API
 * Creates standalone executables for multiple platforms
 */

import { $ } from 'bun';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';

const VERSION = '1.0.0';

type BuildTarget = {
  name: string;
  target:
    | 'bun-darwin-arm64'
    | 'bun-darwin-x64'
    | 'bun-linux-arm64'
    | 'bun-linux-x64'
    | 'bun-linux-arm64-musl'
    | 'bun-linux-x64-musl'
    | 'bun-windows-x64';
  outfile: string;
};

const targets: BuildTarget[] = [
  {
    name: 'macOS Apple Silicon',
    target: 'bun-darwin-arm64',
    outfile: './dist/better-shell-darwin-arm64',
  },
  {
    name: 'macOS Intel',
    target: 'bun-darwin-x64',
    outfile: './dist/better-shell-darwin-x64',
  },
  {
    name: 'Linux ARM64 (glibc)',
    target: 'bun-linux-arm64',
    outfile: './dist/better-shell-linux-arm64',
  },
  {
    name: 'Linux x64 (glibc)',
    target: 'bun-linux-x64',
    outfile: './dist/better-shell-linux-x64',
  },
  {
    name: 'Linux ARM64 (musl)',
    target: 'bun-linux-arm64-musl',
    outfile: './dist/better-shell-linux-arm64-musl',
  },
  {
    name: 'Linux x64 (musl)',
    target: 'bun-linux-x64-musl',
    outfile: './dist/better-shell-linux-x64-musl',
  },
  {
    name: 'Windows x64',
    target: 'bun-windows-x64',
    outfile: './dist/better-shell-windows-x64.exe',
  },
];

async function writeChecksum(outfile: string): Promise<string> {
  const file = Bun.file(outfile);
  const bytes = await file.arrayBuffer();
  const hash = createHash('sha256').update(new Uint8Array(bytes)).digest('hex');
  const checksumPath = `${outfile}.sha256`;

  await Bun.write(checksumPath, `${hash}  ${basename(outfile)}\n`);
  return checksumPath;
}

async function buildTarget(target: BuildTarget): Promise<boolean> {
  console.log(`\n🔨 Building for ${target.name}...`);

  try {
    // Use Bun Shell API for cleaner command execution
    await $`bun build ./src/index.ts --compile --target ${target.target} --outfile ${target.outfile}`;

    // Get file size
    const stat = await Bun.file(target.outfile).stat();
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
    const checksumPath = await writeChecksum(target.outfile);

    console.log(`✅ Built ${target.name}: ${target.outfile} (${sizeMB} MB)`);
    console.log(`   SHA256: ${checksumPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error building ${target.name}:`, error);
    return false;
  }
}

async function buildCurrent(): Promise<void> {
  console.log('🚀 Building better-shell CLI');
  console.log(`Version: ${VERSION}`);

  // Detect current platform
  const platform = process.platform;
  const arch = process.arch;

  let currentTarget: BuildTarget | undefined;

  if (platform === 'darwin' && arch === 'arm64') {
    currentTarget = targets[0]; // macOS Apple Silicon
  } else if (platform === 'darwin' && arch === 'x64') {
    currentTarget = targets[1]; // macOS Intel
  } else if (platform === 'linux' && arch === 'arm64') {
    currentTarget = targets[2]; // Linux ARM64 glibc
  } else if (platform === 'linux' && arch === 'x64') {
    currentTarget = targets[3]; // Linux x64 glibc
  } else if (platform === 'win32' && arch === 'x64') {
    currentTarget = targets[6]; // Windows x64
  }

  if (!currentTarget) {
    console.error(`❌ Unsupported platform: ${platform} ${arch}`);
    process.exit(1);
  }

  // Create dist directory
  await Bun.write('./dist/.keep', '');

  // Build for current platform
  const success = await buildTarget(currentTarget);

  if (success) {
    // Create a symlink for easier access (Unix-like systems only)
    if (platform !== 'win32') {
      const symlinkPath = './dist/better-shell';
      try {
        const filename = currentTarget.outfile.replace('./dist/', '');
        await $`ln -sf ${filename} ${symlinkPath}`;
        console.log(`\n✨ Success! Run with: ${symlinkPath}`);
      } catch {
        console.log(`\n✨ Success! Run with: ${currentTarget.outfile}`);
      }
    } else {
      console.log(`\n✨ Success! Run with: ${currentTarget.outfile}`);
    }
  } else {
    console.error('\n❌ Build failed');
    process.exit(1);
  }
}

async function buildAll(): Promise<void> {
  console.log('🚀 Building better-shell CLI for all platforms');
  console.log(`Version: ${VERSION}`);

  // Create dist directory
  await Bun.write('./dist/.keep', '');

  let successCount = 0;

  for (const target of targets) {
    const success = await buildTarget(target);
    if (success) successCount++;
  }

  console.log(`\n✨ Built ${successCount}/${targets.length} platforms successfully`);

  if (successCount === targets.length) {
    console.log('\n📦 Distribution files:');
    for (const target of targets) {
      console.log(`  ${target.outfile}`);
    }
  } else {
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes('--all')) {
  await buildAll();
} else {
  await buildCurrent();
}
