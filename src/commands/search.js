import chalk from 'chalk';
import ora from 'ora';
import { apiRequest } from '../utils/api.js';

export async function search(query) {
  const spinner = ora('Searching...').start();
  
  try {
    const response = await apiRequest(`/-/v1/search?text=${encodeURIComponent(query)}&size=20`);
    
    if (!response.ok) {
      spinner.fail('Search failed');
      return;
    }
    
    const data = await response.json();
    
    spinner.stop();
    
    if (!data.objects || data.objects.length === 0) {
      console.log(chalk.yellow('No packages found'));
      return;
    }
    
    console.log(chalk.cyan(`Found ${data.objects.length} package(s):\n`));
    
    for (const item of data.objects) {
      const pkg = item.package;
      console.log(chalk.white.bold(pkg.name) + chalk.gray(`@${pkg.version}`));
      if (pkg.description) {
        console.log(chalk.gray(`  ${pkg.description}`));
      }
      console.log('');
    }
    
  } catch (error) {
    spinner.fail(`Search failed: ${error.message}`);
  }
}
