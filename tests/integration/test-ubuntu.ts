/**
 * Automated integration test for Ubuntu.
 * Builds Docker container, runs installation, verifies everything works.
 */

import { $ } from 'bun';

const targetArch = process.arch === 'arm64' ? 'arm64' : 'amd64';
const targetPlatform = `linux/${targetArch}`;

console.log('🧪 Running Ubuntu Integration Test\n');

try {
  // Build Docker image
  console.log(`📦 Building Ubuntu test container (${targetPlatform})...`);
  await $`docker build --build-arg TARGETPLATFORM=${targetPlatform} --build-arg TARGETARCH=${targetArch} -f tests/ubuntu/Dockerfile -t better-shell-ubuntu-test . -q`;
  console.log('✓ Container built\n');

  // Run automated tests
  console.log('🚀 Running automated tests in container...');
  const result =
    await $`docker run --rm --name better-shell-ubuntu-autotest better-shell-ubuntu-test /home/testuser/test-runner.sh`;

  console.log(result.stdout.toString());

  if (result.exitCode === 0) {
    console.log('✅ Ubuntu integration test passed!');
    process.exit(0);
  } else {
    console.log('❌ Ubuntu integration test failed!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
}
