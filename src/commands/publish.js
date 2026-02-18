import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import tar from 'tar';
import crypto from 'crypto';
import { apiRequest } from '../utils/api.js';
import { readPackageJson, getConfig } from '../utils/config.js';

export async function publish(options) {
  const spinner = ora('Preparing package...').start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const pkg = await readPackageJson();
    
    if (!pkg) {
      spinner.fail('No package.json found in current directory');
      return;
    }
    
    if (!pkg.name || !pkg.version) {
      spinner.fail('package.json must have name and version');
      return;
    }
    
    const access = options.access || 'public';
    const isPrivate = access === 'restricted' || access === 'private';
    
    spinner.text = `Packing ${pkg.name}@${pkg.version}...`;
    
    const tarballBuffer = await createTarball(process.cwd(), pkg);
    const tarballName = `${pkg.name.replace('/', '-')}-${pkg.version}.tgz`;
    
    const shasum = crypto.createHash('sha1').update(tarballBuffer).digest('hex');
    const integrity = `sha512-${crypto.createHash('sha512').update(tarballBuffer).digest('base64')}`;
    
    spinner.text = `Publishing ${pkg.name}@${pkg.version} (${isPrivate ? 'private' : 'public'})...`;
    
    const publishBody = {
      _id: pkg.name,
      name: pkg.name,
      description: pkg.description || '',
      readme: await getReadme(),
      access: access,
      'dist-tags': {
        latest: pkg.version
      },
      versions: {
        [pkg.version]: {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description || '',
          main: pkg.main || 'index.js',
          scripts: pkg.scripts || {},
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {},
          _id: `${pkg.name}@${pkg.version}`,
          dist: {
            shasum,
            integrity,
            tarball: ''
          }
        }
      },
      _attachments: {
        [tarballName]: {
          content_type: 'application/octet-stream',
          data: tarballBuffer.toString('base64'),
          length: tarballBuffer.length
        }
      }
    };
    
    const response = await apiRequest(`/${encodeURIComponent(pkg.name)}`, {
      method: 'PUT',
      body: JSON.stringify(publishBody)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      spinner.fail(`Publish failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    const accessLabel = isPrivate ? chalk.yellow('private') : chalk.green('public');
    spinner.succeed(`Published ${pkg.name}@${pkg.version} (${accessLabel})`);
    console.log(chalk.gray(`\nInstall with: privatenpm install ${pkg.name}`));
    
  } catch (error) {
    spinner.fail(`Publish failed: ${error.message}`);
  }
}

async function createTarball(dir, pkg) {
  const files = await getPackageFiles(dir);
  const tempDir = path.join(dir, '.privatenpm-temp');
  const packageDir = path.join(tempDir, 'package');
  const tarballPath = path.join(tempDir, 'package.tgz');
  
  try {
    await fs.mkdir(packageDir, { recursive: true });
    
    for (const file of files) {
      const srcPath = path.join(dir, file);
      const destPath = path.join(packageDir, file);
      
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(srcPath, destPath);
    }
    
    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd: tempDir,
        portable: true
      },
      ['package']
    );
    
    const tarballBuffer = await fs.readFile(tarballPath);
    
    return tarballBuffer;
    
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function getPackageFiles(dir) {
  const files = [];
  const ignorePatterns = [
    'node_modules',
    '.git',
    '.privatenpm-temp',
    '.env',
    '.env.local',
    '*.log'
  ];
  
  async function walk(currentDir, relativePath = '') {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      const shouldIgnore = ignorePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(entry.name);
        }
        return entry.name === pattern;
      });
      
      if (shouldIgnore) continue;
      
      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else {
        files.push(relPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function getReadme() {
  const readmeFiles = ['README.md', 'readme.md', 'README', 'readme'];
  
  for (const file of readmeFiles) {
    try {
      return await fs.readFile(path.join(process.cwd(), file), 'utf-8');
    } catch (e) {
      // Continue to next file
    }
  }
  
  return '';
}
