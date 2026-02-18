import chalk from 'chalk';
import ora from 'ora';
import { apiRequest } from '../utils/api.js';
import { getConfig } from '../utils/config.js';

export async function accessPublic(packageName) {
  await setAccess(packageName, 'public');
}

export async function accessRestricted(packageName) {
  await setAccess(packageName, 'restricted');
}

async function setAccess(packageName, access) {
  const spinner = ora(`Setting ${packageName} to ${access}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/package/${encodeURIComponent(packageName)}/access`, {
      method: 'POST',
      body: JSON.stringify({ access })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    const accessLabel = access === 'restricted' ? chalk.yellow('private') : chalk.green('public');
    spinner.succeed(`${packageName} is now ${accessLabel}`);
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function grantAccess(packageName, username, options) {
  const spinner = ora(`Granting ${username} access to ${packageName}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const permissions = options.readWrite ? 'read-write' : 'read-only';
    
    const response = await apiRequest(`/-/package/${encodeURIComponent(packageName)}/collaborators/${username}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    spinner.succeed(`Granted ${permissions} access to ${username} for ${packageName}`);
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function revokeAccess(packageName, username) {
  const spinner = ora(`Revoking ${username} access from ${packageName}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/package/${encodeURIComponent(packageName)}/collaborators/${username}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    spinner.succeed(`Revoked ${username} access from ${packageName}`);
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function listCollaborators(packageName) {
  const spinner = ora(`Fetching collaborators for ${packageName}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/package/${encodeURIComponent(packageName)}/collaborators`);
    
    if (!response.ok) {
      const result = await response.json();
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    const collaborators = await response.json();
    
    spinner.stop();
    
    console.log(chalk.cyan(`\nCollaborators for ${packageName}:\n`));
    
    for (const [username, permission] of Object.entries(collaborators)) {
      let permLabel;
      if (permission === 'owner') {
        permLabel = chalk.magenta('owner');
      } else if (permission === 'read-write') {
        permLabel = chalk.green('read-write');
      } else {
        permLabel = chalk.gray('read-only');
      }
      console.log(`  ${username}: ${permLabel}`);
    }
    
    console.log('');
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}
