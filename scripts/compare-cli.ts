#!/usr/bin/env bun

import { mkdir } from 'node:fs/promises';
import { basename } from 'node:path';
import { performance } from 'node:perf_hooks';

interface CliBuild {
  name: string;
  path: string;
  buildCommand: string[];
}

interface BenchCase {
  name: string;
  args: string[];
}

interface BenchResult {
  name: string;
  averageMs: number;
  minMs: number;
  maxMs: number;
}

interface CliReport {
  name: string;
  path: string;
  sizeBytes: number;
  sizeMb: number;
  benches: BenchResult[];
}

const runs = 25;
const warmups = 5;
const reportPath = 'reports/cli-comparison.html';

const clis: CliBuild[] = [
  {
    name: 'Bun standalone',
    path: './dist/better-shell',
    buildCommand: ['bun', 'run', 'build'],
  },
  {
    name: 'Rust native',
    path: './rust-cli/target/release/better-shell-rust',
    buildCommand: ['cargo', 'build', '--release', '--manifest-path', 'rust-cli/Cargo.toml'],
  },
];

const benchCases: BenchCase[] = [
  { name: 'Version', args: ['--version'] },
  { name: 'Help', args: ['--help'] },
  { name: 'Dry-run install plan', args: ['install', '--dry-run', '--minimal', '--no-tmux'] },
];

const runCommand = (command: string, args: string[]): void => {
  const result = Bun.spawnSync([command, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr);
    throw new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr}`);
  }
};

const runBuild = (cli: CliBuild): void => {
  const [command, ...args] = cli.buildCommand;
  if (!command) throw new Error(`Missing build command for ${cli.name}`);
  console.log(`Building ${cli.name}...`);
  runCommand(command, args);
};

const measure = (binaryPath: string, benchCase: BenchCase): BenchResult => {
  for (let index = 0; index < warmups; index += 1) {
    runCommand(binaryPath, benchCase.args);
  }

  const timings: number[] = [];

  for (let index = 0; index < runs; index += 1) {
    const startedAt = performance.now();
    runCommand(binaryPath, benchCase.args);
    timings.push(performance.now() - startedAt);
  }

  const total = timings.reduce((sum, timing) => sum + timing, 0);
  return {
    name: benchCase.name,
    averageMs: total / timings.length,
    minMs: Math.min(...timings),
    maxMs: Math.max(...timings),
  };
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatMs = (ms: number): string => `${ms.toFixed(2)} ms`;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getFastestForCase = (reports: CliReport[], caseName: string): number => {
  const values = reports
    .map((report) => report.benches.find((bench) => bench.name === caseName)?.averageMs)
    .filter((value): value is number => typeof value === 'number');
  return Math.min(...values);
};

const getSmallestSize = (reports: CliReport[]): number =>
  Math.min(...reports.map((report) => report.sizeBytes));

const createHtml = (reports: CliReport[]): string => {
  const smallestSize = getSmallestSize(reports);
  const generatedAt = new Date().toISOString();
  const maxSize = Math.max(...reports.map((report) => report.sizeBytes));
  const maxAverage = Math.max(
    ...reports.flatMap((report) => report.benches.map((bench) => bench.averageMs))
  );

  const sizeRows = reports
    .map((report) => {
      const multiplier = report.sizeBytes / smallestSize;
      const width = (report.sizeBytes / maxSize) * 100;
      return `<tr>
        <td>${escapeHtml(report.name)}</td>
        <td><code>${escapeHtml(report.path)}</code></td>
        <td>${formatBytes(report.sizeBytes)}</td>
        <td>${multiplier.toFixed(1)}×</td>
        <td><div class="bar"><span style="width:${width.toFixed(1)}%"></span></div></td>
      </tr>`;
    })
    .join('\n');

  const benchmarkSections = benchCases
    .map((benchCase) => {
      const fastest = getFastestForCase(reports, benchCase.name);
      const rows = reports
        .map((report) => {
          const bench = report.benches.find((candidate) => candidate.name === benchCase.name);
          if (!bench) return '';
          const multiplier = bench.averageMs / fastest;
          const width = (bench.averageMs / maxAverage) * 100;
          return `<tr>
            <td>${escapeHtml(report.name)}</td>
            <td>${formatMs(bench.averageMs)}</td>
            <td>${formatMs(bench.minMs)}</td>
            <td>${formatMs(bench.maxMs)}</td>
            <td>${multiplier.toFixed(1)}×</td>
            <td><div class="bar"><span style="width:${width.toFixed(1)}%"></span></div></td>
          </tr>`;
        })
        .join('\n');

      return `<section class="card">
        <h2>${escapeHtml(benchCase.name)}</h2>
        <p><code>${escapeHtml(benchCase.args.join(' '))}</code></p>
        <table>
          <thead><tr><th>CLI</th><th>Average</th><th>Min</th><th>Max</th><th>Relative</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
    })
    .join('\n');

  const summary = reports
    .map((report) => {
      const versionBench = report.benches.find((bench) => bench.name === 'Version');
      return `<li><strong>${escapeHtml(report.name)}</strong>: ${formatBytes(report.sizeBytes)} binary, ${versionBench ? formatMs(versionBench.averageMs) : 'n/a'} avg startup.</li>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Better Shell CLI comparison</title>
  <style>
    :root { color-scheme: dark; --bg: #0f172a; --panel: #111827; --muted: #94a3b8; --text: #e5e7eb; --cyan: #22d3ee; --green: #34d399; --border: #263244; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(circle at top left, #164e63 0, transparent 28rem), var(--bg); color: var(--text); }
    main { width: min(1100px, calc(100vw - 32px)); margin: 48px auto; }
    .hero { margin-bottom: 28px; }
    h1 { margin: 0 0 8px; font-size: clamp(2rem, 6vw, 4rem); letter-spacing: -0.05em; }
    h2 { margin: 0 0 8px; font-size: 1.25rem; }
    p, li { color: var(--muted); line-height: 1.6; }
    code { color: #bae6fd; background: rgba(34, 211, 238, 0.08); padding: 0.15rem 0.35rem; border-radius: 0.35rem; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .card { background: rgba(17, 24, 39, 0.78); border: 1px solid var(--border); border-radius: 20px; padding: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.24); backdrop-filter: blur(10px); margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; }
    th, td { padding: 12px 10px; border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap; }
    th { color: var(--muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.08em; }
    tr:last-child td { border-bottom: 0; }
    .bar { width: 100%; min-width: 120px; height: 10px; background: rgba(148, 163, 184, 0.18); border-radius: 999px; overflow: hidden; }
    .bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--green), var(--cyan)); border-radius: inherit; }
    .pill { display: inline-flex; gap: 8px; align-items: center; color: var(--cyan); border: 1px solid rgba(34, 211, 238, 0.3); background: rgba(34, 211, 238, 0.08); padding: 6px 10px; border-radius: 999px; font-size: 0.9rem; }
    .note { border-left: 3px solid var(--cyan); padding-left: 14px; }
    @media (max-width: 760px) { table { display: block; overflow-x: auto; } main { margin-top: 28px; } }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <span class="pill">Generated ${escapeHtml(generatedAt)}</span>
      <h1>Better Shell CLI comparison</h1>
      <p>Bun standalone vs. experimental Rust native implementation. Benchmarks run ${runs} times after ${warmups} warmups on this machine.</p>
    </section>

    <section class="card">
      <h2>Summary</h2>
      <ul>${summary}</ul>
      <p class="note">The Rust CLI now mirrors the main user-facing commands and installer flow. Bun remains the default production implementation while the Rust port is evaluated.</p>
    </section>

    <section class="card">
      <h2>Binary size</h2>
      <table>
        <thead><tr><th>CLI</th><th>Path</th><th>Size</th><th>Relative</th><th></th></tr></thead>
        <tbody>${sizeRows}</tbody>
      </table>
    </section>

    ${benchmarkSections}
  </main>
</body>
</html>`;
};

await mkdir('reports', { recursive: true });

for (const cli of clis) {
  runBuild(cli);
}

const reports: CliReport[] = [];

for (const cli of clis) {
  const file = Bun.file(cli.path);
  const stat = await file.stat();
  console.log(`Benchmarking ${cli.name} (${basename(cli.path)})...`);

  reports.push({
    name: cli.name,
    path: cli.path,
    sizeBytes: stat.size,
    sizeMb: stat.size / 1024 / 1024,
    benches: benchCases.map((benchCase) => measure(cli.path, benchCase)),
  });
}

await Bun.write(reportPath, createHtml(reports));

console.log(`\nWrote ${reportPath}`);
for (const report of reports) {
  const versionBench = report.benches.find((bench) => bench.name === 'Version');
  console.log(
    `${report.name}: ${formatBytes(report.sizeBytes)}${versionBench ? `, ${formatMs(versionBench.averageMs)} avg startup` : ''}`
  );
}
