/**
 * Automated integration test for Ubuntu
 * Builds Docker container, runs installation, verifies everything works
 */

import { $ } from 'bun';

console.log('🧪 Running Ubuntu Integration Test\n');

try {
  // Build Docker image
  console.log('📦 Building Ubuntu test container...');
  await $`docker build -f tests/ubuntu/Dockerfile -t better-terminal-ubuntu-test . -q`;
  console.log('✓ Container built\n');

  // Run automated tests
  console.log('🚀 Running automated tests in container...');
  const result =
    await $`docker run --rm --name better-terminal-ubuntu-autotest better-terminal-ubuntu-test /home/testuser/test-runner.sh`;

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
