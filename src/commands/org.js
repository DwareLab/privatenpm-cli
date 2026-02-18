import chalk from 'chalk';
import ora from 'ora';
import { apiRequest } from '../utils/api.js';
import { getConfig } from '../utils/config.js';

export async function createOrg(name, options) {
  const spinner = ora(`Creating organization @${name}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest('/-/org', {
      method: 'POST',
      body: JSON.stringify({ 
        name, 
        displayName: options.displayName || name 
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    spinner.succeed(`Created organization @${name}`);
    console.log(chalk.gray(`\nPublish scoped packages with: privatenpm publish`));
    console.log(chalk.gray(`Package names should be: @${name}/package-name`));
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function listOrgs() {
  const spinner = ora('Fetching organizations...').start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest('/-/org');
    
    if (!response.ok) {
      const result = await response.json();
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    const data = await response.json();
    
    spinner.stop();
    
    if (!data.organizations || data.organizations.length === 0) {
      console.log(chalk.yellow('You are not a member of any organizations'));
      console.log(chalk.gray('\nCreate one with: privatenpm org create <name>'));
      return;
    }
    
    console.log(chalk.cyan('\nYour organizations:\n'));
    
    for (const org of data.organizations) {
      const roleColor = org.role === 'owner' ? chalk.magenta : 
                        org.role === 'admin' ? chalk.green : chalk.gray;
      console.log(`  @${chalk.white.bold(org.name)} ${roleColor(`(${org.role})`)}`);
      if (org.displayName !== org.name) {
        console.log(chalk.gray(`    ${org.displayName}`));
      }
    }
    
    console.log('');
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function showOrg(name) {
  const spinner = ora(`Fetching organization @${name}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/org/${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      const result = await response.json();
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    const org = await response.json();
    
    spinner.stop();
    
    console.log('');
    console.log(chalk.cyan.bold(`@${org.name}`));
    if (org.displayName !== org.name) {
      console.log(chalk.gray(org.displayName));
    }
    console.log('');
    
    console.log(chalk.white.bold('Members:'));
    for (const member of org.members) {
      const roleColor = member.role === 'owner' ? chalk.magenta : 
                        member.role === 'admin' ? chalk.green : chalk.gray;
      console.log(`  ${member.username} ${roleColor(`(${member.role})`)}`);
    }
    
    console.log('');
    console.log(chalk.white.bold('Packages:'));
    if (org.packages.length === 0) {
      console.log(chalk.gray('  No packages yet'));
    } else {
      for (const pkg of org.packages) {
        const accessLabel = pkg.private ? chalk.yellow('private') : chalk.green('public');
        console.log(`  ${pkg.name} ${accessLabel}`);
        if (pkg.description) {
          console.log(chalk.gray(`    ${pkg.description}`));
        }
      }
    }
    
    console.log('');
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function deleteOrg(name) {
  const spinner = ora(`Deleting organization @${name}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/org/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    spinner.succeed(`Deleted organization @${name}`);
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function addMember(orgName, username, options) {
  const role = options.role || 'member';
  const spinner = ora(`Adding ${username} to @${orgName} as ${role}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/org/${encodeURIComponent(orgName)}/members/${username}`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    spinner.succeed(`Added ${username} to @${orgName} as ${role}`);
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function removeMember(orgName, username) {
  const spinner = ora(`Removing ${username} from @${orgName}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/org/${encodeURIComponent(orgName)}/members/${username}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    spinner.succeed(`Removed ${username} from @${orgName}`);
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}

export async function listOrgPackages(orgName) {
  const spinner = ora(`Fetching packages for @${orgName}...`).start();
  
  try {
    const config = await getConfig();
    
    if (!config.token) {
      spinner.fail('Not logged in. Run "privatenpm login" first.');
      return;
    }
    
    const response = await apiRequest(`/-/org/${encodeURIComponent(orgName)}/packages`);
    
    if (!response.ok) {
      const result = await response.json();
      spinner.fail(`Failed: ${result.error || 'Unknown error'}`);
      return;
    }
    
    const data = await response.json();
    
    spinner.stop();
    
    if (!data.packages || data.packages.length === 0) {
      console.log(chalk.yellow(`\nNo packages in @${orgName}`));
      return;
    }
    
    console.log(chalk.cyan(`\nPackages in @${orgName}:\n`));
    
    for (const pkg of data.packages) {
      const accessLabel = pkg.private ? chalk.yellow('private') : chalk.green('public');
      console.log(`  ${chalk.white.bold(pkg.name)}@${pkg.version || '0.0.0'} ${accessLabel}`);
      if (pkg.description) {
        console.log(chalk.gray(`    ${pkg.description}`));
      }
    }
    
    console.log('');
    
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
  }
}
