import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import tar from 'tar';
import { getPackageMetadata, downloadTarball } from '../utils/api.js';
import { readPackageJson, writePackageJson } from '../utils/config.js';
import semver from 'semver';

export async function install(packages, options) {
  try {
    const cwd = process.cwd();
    const nodeModulesPath = path.join(cwd, 'node_modules');
    
    await fs.mkdir(nodeModulesPath, { recursive: true });
    
    if (!packages || packages.length === 0) {
      const pkg = await readPackageJson();
      if (!pkg) {
        console.log(chalk.red('No package.json found in current directory'));
        return;
      }
      
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
      
      packages = Object.keys(allDeps);
      
      if (packages.length === 0) {
        console.log(chalk.yellow('No dependencies to install'));
        return;
      }
    }
    
    const installed = [];
    const failed = [];
    
    for (const pkgSpec of packages) {
      const { name, version } = parsePackageSpec(pkgSpec);
      const spinner = ora(`Installing ${name}...`).start();
      
      try {
        const metadata = await getPackageMetadata(name);
        
        if (!metadata) {
          spinner.fail(`Package ${name} not found`);
          failed.push(name);
          continue;
        }
        
        const targetVersion = resolveVersion(metadata, version);
        
        if (!targetVersion) {
          spinner.fail(`No matching version found for ${name}@${version || 'latest'}`);
          failed.push(name);
          continue;
        }
        
        const versionData = metadata.versions[targetVersion];
        const tarballUrl = versionData.dist.tarball;
        
        const tarballBuffer = await downloadTarball(tarballUrl);
        
        const packageDir = path.join(nodeModulesPath, name);
        await fs.mkdir(packageDir, { recursive: true });
        
        const tempTarball = path.join(nodeModulesPath, `${name.replace('/', '-')}-${targetVersion}.tgz`);
        await fs.writeFile(tempTarball, tarballBuffer);
        
        await tar.extract({
          file: tempTarball,
          cwd: packageDir,
          strip: 1
        });
        
        await fs.unlink(tempTarball);
        
        spinner.succeed(`Installed ${name}@${targetVersion}`);
        installed.push({ name, version: targetVersion });
        
        if (options.saveDev || options.global === undefined) {
          await updatePackageJson(name, targetVersion, options.saveDev);
        }
        
      } catch (error) {
        spinner.fail(`Failed to install ${name}: ${error.message}`);
        failed.push(name);
      }
    }
    
    console.log('');
    
    if (installed.length > 0) {
      console.log(chalk.green(`Successfully installed ${installed.length} package(s)`));
    }
    
    if (failed.length > 0) {
      console.log(chalk.red(`Failed to install ${failed.length} package(s): ${failed.join(', ')}`));
    }
    
  } catch (error) {
    console.log(chalk.red(`Install failed: ${error.message}`));
  }
}

function parsePackageSpec(spec) {
  const atIndex = spec.lastIndexOf('@');
  
  if (atIndex > 0) {
    return {
      name: spec.substring(0, atIndex),
      version: spec.substring(atIndex + 1)
    };
  }
  
  return { name: spec, version: null };
}

function resolveVersion(metadata, requestedVersion) {
  const versions = Object.keys(metadata.versions);
  
  if (!requestedVersion || requestedVersion === 'latest') {
    return metadata['dist-tags']?.latest || versions[versions.length - 1];
  }
  
  if (versions.includes(requestedVersion)) {
    return requestedVersion;
  }
  
  const matching = versions.filter(v => semver.satisfies(v, requestedVersion));
  if (matching.length > 0) {
    return matching.sort(semver.rcompare)[0];
  }
  
  return null;
}

async function updatePackageJson(packageName, version, isDev) {
  const pkg = await readPackageJson();
  
  if (!pkg) {
    return;
  }
  
  const depKey = isDev ? 'devDependencies' : 'dependencies';
  
  if (!pkg[depKey]) {
    pkg[depKey] = {};
  }
  
  pkg[depKey][packageName] = `^${version}`;
  
  await writePackageJson(pkg);
}
