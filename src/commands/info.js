import chalk from 'chalk';
import ora from 'ora';
import { getPackageMetadata } from '../utils/api.js';

export async function info(packageName) {
  const spinner = ora(`Fetching info for ${packageName}...`).start();
  
  try {
    const metadata = await getPackageMetadata(packageName);
    
    if (!metadata) {
      spinner.fail(`Package ${packageName} not found`);
      return;
    }
    
    spinner.stop();
    
    const latestVersion = metadata['dist-tags']?.latest;
    const versions = Object.keys(metadata.versions || {});
    
    console.log('');
    console.log(chalk.cyan.bold(metadata.name) + chalk.gray(`@${latestVersion}`));
    console.log('');
    
    if (metadata.description) {
      console.log(chalk.white(metadata.description));
      console.log('');
    }
    
    console.log(chalk.gray('Latest version:'), latestVersion);
    console.log(chalk.gray('All versions:'), versions.join(', '));
    
    if (latestVersion && metadata.versions[latestVersion]) {
      const latest = metadata.versions[latestVersion];
      
      if (latest.dependencies && Object.keys(latest.dependencies).length > 0) {
        console.log('');
        console.log(chalk.gray('Dependencies:'));
        for (const [dep, ver] of Object.entries(latest.dependencies)) {
          console.log(chalk.gray(`  ${dep}: ${ver}`));
        }
      }
    }
    
    console.log('');
    console.log(chalk.gray('Install:'), `privatenpm install ${packageName}`);
    
  } catch (error) {
    spinner.fail(`Failed to fetch info: ${error.message}`);
  }
}
