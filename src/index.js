#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { login, logout, whoami } from './commands/auth.js';
import { install } from './commands/install.js';
import { publish } from './commands/publish.js';
import { search } from './commands/search.js';
import { info } from './commands/info.js';
import { accessPublic, accessRestricted, grantAccess, revokeAccess, listCollaborators } from './commands/access.js';
import { createOrg, listOrgs, showOrg, deleteOrg, addMember, removeMember, listOrgPackages } from './commands/org.js';
import { createToken, listTokens, revokeToken, showSetupInstructions } from './commands/token.js';
import { getConfig } from './utils/config.js';

const program = new Command();

program
  .name('privatenpm')
  .description('CLI for private npm registry')
  .version('1.0.0');

program
  .command('login')
  .description('Login to the private registry')
  .option('-r, --registry <url>', 'Registry URL')
  .action(login);

program
  .command('logout')
  .description('Logout from the private registry')
  .action(logout);

program
  .command('whoami')
  .description('Display the current logged in user')
  .action(whoami);

program
  .command('install [packages...]')
  .alias('i')
  .description('Install packages from the private registry')
  .option('-D, --save-dev', 'Save as dev dependency')
  .option('-g, --global', 'Install globally')
  .action(install);

program
  .command('publish')
  .description('Publish a package to the private registry')
  .option('--access <access>', 'Package access level (public/restricted/private)', 'public')
  .action(publish);

program
  .command('search <query>')
  .description('Search for packages')
  .action(search);

program
  .command('info <package>')
  .description('Show package information')
  .action(info);

const accessCmd = program
  .command('access')
  .description('Manage package access');

accessCmd
  .command('public <package>')
  .description('Set a package to public (anyone can install)')
  .action(accessPublic);

accessCmd
  .command('restricted <package>')
  .alias('private')
  .description('Set a package to private (only authorized users can install)')
  .action(accessRestricted);

accessCmd
  .command('grant <package> <username>')
  .description('Grant a user access to a private package')
  .option('--read-write', 'Grant read-write access (default is read-only)')
  .action(grantAccess);

accessCmd
  .command('revoke <package> <username>')
  .description('Revoke a user access from a package')
  .action(revokeAccess);

accessCmd
  .command('list <package>')
  .alias('ls')
  .description('List all collaborators for a package')
  .action(listCollaborators);

const orgCmd = program
  .command('org')
  .description('Manage organizations');

orgCmd
  .command('create <name>')
  .description('Create a new organization')
  .option('-d, --display-name <name>', 'Display name for the organization')
  .action(createOrg);

orgCmd
  .command('list')
  .alias('ls')
  .description('List organizations you belong to')
  .action(listOrgs);

orgCmd
  .command('show <name>')
  .description('Show organization details')
  .action(showOrg);

orgCmd
  .command('delete <name>')
  .description('Delete an organization (must have no packages)')
  .action(deleteOrg);

orgCmd
  .command('add <org> <username>')
  .description('Add a member to an organization')
  .option('--role <role>', 'Role: member, admin, or owner', 'member')
  .action(addMember);

orgCmd
  .command('remove <org> <username>')
  .alias('rm')
  .description('Remove a member from an organization')
  .action(removeMember);

orgCmd
  .command('packages <org>')
  .description('List packages in an organization')
  .action(listOrgPackages);

const tokenCmd = program
  .command('token')
  .description('Manage API tokens for CI/CD');

tokenCmd
  .command('create')
  .description('Create a new API token')
  .option('-n, --name <name>', 'Token name')
  .action(createToken);

tokenCmd
  .command('list')
  .alias('ls')
  .description('List all tokens')
  .action(listTokens);

tokenCmd
  .command('revoke <tokenId>')
  .description('Revoke a token')
  .action(revokeToken);

program
  .command('setup')
  .description('Show CI/CD setup instructions')
  .action(showSetupInstructions);

program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    const config = await getConfig();
    console.log(chalk.cyan('Current configuration:'));
    console.log(chalk.gray('Registry:'), config.registry || 'Not set');
    console.log(chalk.gray('Token:'), config.token ? '****' + config.token.slice(-8) : 'Not set');
  });

program.parse();
