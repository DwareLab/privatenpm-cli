import chalk from 'chalk';
import prompts from 'prompts';
import fetch from 'node-fetch';
import { getConfig, saveConfig, clearConfig } from '../utils/config.js';

export async function login(options) {
  try {
    const config = await getConfig();
    const registry = options.registry || config.registry || 'https://registry.growthnodes.com';
    
    console.log(chalk.cyan(`Logging in to ${registry}...\n`));
    
    const response = await prompts([
      {
        type: 'text',
        name: 'username',
        message: 'Username:'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:'
      },
      {
        type: 'text',
        name: 'email',
        message: 'Email (optional):',
        initial: ''
      }
    ]);
    
    if (!response.username || !response.password) {
      console.log(chalk.red('Login cancelled'));
      return;
    }
    
    const loginResponse = await fetch(`${registry}/-/user/org.couchdb.user:${response.username}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: response.username,
        password: response.password,
        email: response.email || `${response.username}@localhost`
      })
    });
    
    const data = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log(chalk.red(`Login failed: ${data.error || 'Unknown error'}`));
      return;
    }
    
    await saveConfig({
      registry,
      token: data.token,
      username: response.username
    });
    
    console.log(chalk.green(`\nLogged in as ${response.username}`));
    
  } catch (error) {
    console.log(chalk.red(`Login failed: ${error.message}`));
  }
}

export async function logout() {
  try {
    const config = await getConfig();
    
    if (!config.token) {
      console.log(chalk.yellow('Not logged in'));
      return;
    }
    
    try {
      await fetch(`${config.registry}/-/user/token/~`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.token}`
        }
      });
    } catch (e) {
      // Ignore network errors during logout
    }
    
    await clearConfig();
    console.log(chalk.green('Logged out successfully'));
    
  } catch (error) {
    console.log(chalk.red(`Logout failed: ${error.message}`));
  }
}

export async function whoami() {
  try {
    const config = await getConfig();
    
    if (!config.token || !config.username) {
      console.log(chalk.yellow('Not logged in'));
      return;
    }
    
    console.log(chalk.cyan(config.username));
    
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}
