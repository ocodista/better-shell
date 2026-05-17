/**
 * Automated integration test for Alpine.
 * Builds Docker container, runs installation, verifies everything works.
 */

import { $ } from 'bun';

const targetArch = process.arch === 'arm64' ? 'arm64' : 'amd64';
const targetPlatform = `linux/${targetArch}`;

console.log('🧪 Running Alpine Integration Test\n');

try {
  // Build Docker image
  console.log(`📦 Building Alpine test container (${targetPlatform})...`);
  await $`docker build --build-arg TARGETPLATFORM=${targetPlatform} --build-arg TARGETARCH=${targetArch} -f tests/alpine/Dockerfile -t better-shell-alpine-test . -q`;
  console.log('✓ Container built\n');

  // Run automated tests
  console.log('🚀 Running automated tests in container...');
  const result =
    await $`docker run --rm --name better-shell-alpine-autotest better-shell-alpine-test /home/testuser/test-runner.sh`;

  console.log(result.stdout.toString());

  if (result.exitCode === 0) {
    console.log('✅ Alpine integration test passed!');
    process.exit(0);
  } else {
    console.log('❌ Alpine integration test failed!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
}
