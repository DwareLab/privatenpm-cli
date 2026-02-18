import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { apiRequest } from '../utils/api.js';
import { getConfig } from '../utils/config.js';

export async function createToken(options) {
  try {
    const config = await getConfig();
    
    if (!config.token) {
      console.log(chalk.red('Not logged in. Run "privatenpm login" first.'));
      return;
    }
    
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'Token name (e.g., "vercel-deploy", "github-actions"):',
      initial: options.name || ''
    });
    
    if (!response.name) {
      console.log(chalk.yellow('Cancelled'));
      return;
    }
    
    const spinner = ora('Creating token...').start();
    
    const apiResponse = await apiRequest('/-/npm/v1/tokens', {
      method: 'POST',
      body: JSON.stringify({ name: response.name })
    });
    
    const result = await apiResponse.json();
    
    if (!apiResponse.ok) {
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    spinner.succeed('Token created');
    
    console.log('');
    console.log(chalk.cyan('Token:'), chalk.yellow(result.token));
    console.log('');
    console.log(chalk.gray('Add this to your CI/CD environment variables as PRIVATE_NPM_TOKEN'));
    console.log(chalk.gray('This token will not be shown again, so save it now!'));
    console.log('');
    
  } catch (error) {
    console.log(chalk.red(`Failed: ${error.message}`));
  }
}

export async function listTokens() {
  const spinner = ora('Fetching tokens...').start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest('/-/npm/v1/tokens');
    
    if (!response.ok) {
      const result = await response.json();
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    const data = await response.json();
    
    spinner.stop();
    
    if (!data.tokens || data.tokens.length === 0) {
      console.log(chalk.yellow('\nNo tokens found'));
      console.log(chalk.gray('Create one with: privatenpm token create'));
      return;
    }
    
    console.log(chalk.cyan('\nYour tokens:\n'));
    
    for (const token of data.tokens) {
      console.log(`  ${chalk.white.bold(token.name || 'unnamed')}`);
      console.log(chalk.gray(`    ID: ${token.id}`));
      console.log(chalk.gray(`    Created: ${new Date(token.created_at).toLocaleDateString()}`));
      if (token.last_used_at) {
        console.log(chalk.gray(`    Last used: ${new Date(token.last_used_at).toLocaleDateString()}`));
      }
      console.log('');
    }
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function revokeToken(tokenId) {
  const spinner = ora('Revoking token...').start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/npm/v1/tokens/${tokenId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const result = await response.json();
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    spinner.succeed('Token revoked');
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function showSetupInstructions() {
  const config = await getConfig();
  const registry = config.registry || 'https://registry.growthnodes.com';
  const registryHost = new URL(registry).host;
  
  console.log(chalk.cyan.bold('\n=== Setup Instructions ===\n'));
  
  console.log(chalk.white.bold('1. Create a token for CI/CD:'));
  console.log(chalk.gray('   privatenpm token create\n'));
  
  console.log(chalk.white.bold('2. Add .npmrc to your project:'));
  console.log(chalk.gray('   Create a file named .npmrc in your project root:\n'));
  console.log(chalk.green(`   @mycompany:registry=${registry}/`));
  console.log(chalk.green(`   //${registryHost}/:_authToken=\${PRIVATE_NPM_TOKEN}\n`));
  
  console.log(chalk.white.bold('3. Add environment variable:'));
  console.log(chalk.gray('   Add PRIVATE_NPM_TOKEN to your CI/CD service:\n'));
  console.log(chalk.gray('   - Vercel: Project Settings > Environment Variables'));
  console.log(chalk.gray('   - GitHub Actions: Repository Settings > Secrets'));
  console.log(chalk.gray('   - Netlify: Site Settings > Environment Variables\n'));
  
  console.log(chalk.white.bold('4. Commit .npmrc to your repo'));
  console.log(chalk.gray('   The token is read from env var, so .npmrc is safe to commit.\n'));
  
  console.log(chalk.cyan('That\'s it! Your CI/CD will now install private packages automatically.\n'));
}
