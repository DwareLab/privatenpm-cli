# privatenpm

A command-line interface for managing packages on your private npm registry.

## Installation

```bash
npm install -g privatenpm
```

Or with yarn:

```bash
yarn global add privatenpm
```

Or with pnpm:

```bash
pnpm add -g privatenpm
```

## Quick Start

```bash
# Login to the registry
privatenpm login

# Publish a package
cd my-package
privatenpm publish

# Install a package
privatenpm install my-package

# Search for packages
privatenpm search query
```

## Commands

### Authentication

| Command | Description |
|---------|-------------|
| `privatenpm login` | Login to the registry |
| `privatenpm logout` | Logout from the registry |
| `privatenpm whoami` | Display current logged in user |

### Packages

| Command | Description |
|---------|-------------|
| `privatenpm publish` | Publish a package |
| `privatenpm install <pkg>` | Install a package |
| `privatenpm search <query>` | Search for packages |
| `privatenpm info <pkg>` | Show package information |

### Access Control

| Command | Description |
|---------|-------------|
| `privatenpm access public <pkg>` | Make a package public |
| `privatenpm access restricted <pkg>` | Make a package private |
| `privatenpm access grant <pkg> <user>` | Grant user access to a package |
| `privatenpm access revoke <pkg> <user>` | Revoke user access |
| `privatenpm access list <pkg>` | List package collaborators |

### Organizations

| Command | Description |
|---------|-------------|
| `privatenpm org create <name>` | Create an organization |
| `privatenpm org list` | List your organizations |
| `privatenpm org show <name>` | Show organization details |
| `privatenpm org delete <name>` | Delete an organization |
| `privatenpm org add <org> <user>` | Add member to organization |
| `privatenpm org remove <org> <user>` | Remove member from organization |
| `privatenpm org packages <org>` | List organization packages |

### CI/CD Tokens

| Command | Description |
|---------|-------------|
| `privatenpm token create` | Create an API token |
| `privatenpm token list` | List all tokens |
| `privatenpm token revoke <id>` | Revoke a token |
| `privatenpm setup` | Show CI/CD setup instructions |

### Configuration

| Command | Description |
|---------|-------------|
| `privatenpm config` | Show current configuration |

## Using with npm/pnpm/yarn

You can also use standard package managers with your private registry:

### Per-command

```bash
npm install my-package --registry=https://registry.growthnodes.com
pnpm install my-package --registry=https://registry.growthnodes.com
yarn add my-package --registry=https://registry.growthnodes.com
```

### Project .npmrc

Create a `.npmrc` file in your project root:

```ini
registry=https://registry.growthnodes.com
//registry.growthnodes.com/:_authToken=${NPM_TOKEN}
```

### Global .npmrc

Add to your `~/.npmrc`:

```ini
registry=https://registry.growthnodes.com
//registry.growthnodes.com/:_authToken=your-token-here
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Setup private registry
  run: |
    echo "registry=https://registry.growthnodes.com" >> .npmrc
    echo "//registry.growthnodes.com/:_authToken=${{ secrets.NPM_TOKEN }}" >> .npmrc

- name: Install dependencies
  run: npm install

- name: Publish package
  run: npm publish
```

### GitLab CI

```yaml
publish:
  script:
    - echo "registry=https://registry.growthnodes.com" >> .npmrc
    - echo "//registry.growthnodes.com/:_authToken=${NPM_TOKEN}" >> .npmrc
    - npm publish
```

## Configuration

Configuration is stored in `~/.privatenpm/config.json`:

- **registry**: The registry URL
- **token**: Your authentication token
- **username**: Your username

## License

MIT
