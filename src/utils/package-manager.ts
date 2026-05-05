/**
 * Package manager command planning utilities.
 */

import type { ExecOptions } from './shell';
import { shell } from './shell';
import { platform, type PackageManager } from './platform';

export interface PackageInstallPlan {
  update?: string;
  install: string;
}

const packageNamePattern = /^[a-zA-Z0-9@._+-]+$/;

const getPackageList = (packages: readonly string[]): string | undefined => {
  if (packages.length === 0) return undefined;
  if (!packages.every((packageName) => packageNamePattern.test(packageName))) {
    return undefined;
  }

  return packages.join(' ');
};

export const getPackageInstallPlan = (
  packageManager: PackageManager,
  packages: readonly string[]
): PackageInstallPlan | undefined => {
  const packageList = getPackageList(packages);
  if (!packageList) return undefined;

  switch (packageManager) {
    case 'brew':
      return { install: `brew install ${packageList}` };
    case 'apt':
      return {
        update: 'apt-get update',
        install: `apt-get install -y ${packageList}`,
      };
    case 'dnf':
      return { install: `dnf install -y ${packageList}` };
    case 'pacman':
      return { install: `pacman -S --noconfirm ${packageList}` };
    case 'apk':
      return { install: `apk add --no-cache ${packageList}` };
    case 'unknown':
      return undefined;
  }
};

export const installPackages = async (
  packages: readonly string[],
  options: ExecOptions = {}
): Promise<boolean> => {
  const plan = getPackageInstallPlan(platform.packageManager, packages);
  if (!plan) return false;

  if (plan.update) {
    await shell.exec(plan.update, { silent: true, ignoreError: true });
  }

  const result = await shell.exec(plan.install, options);
  return result.success;
};
