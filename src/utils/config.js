import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.privatenpm');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const DEFAULT_REGISTRY = 'https://registry.growthnodes.com';

async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function getConfig() {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      registry: DEFAULT_REGISTRY,
      token: null
    };
  }
}

export async function saveConfig(config) {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function getRegistry() {
  const config = await getConfig();
  return config.registry || DEFAULT_REGISTRY;
}

export async function setRegistry(registry) {
  const config = await getConfig();
  config.registry = registry;
  await saveConfig(config);
}

export async function getToken() {
  const config = await getConfig();
  return config.token;
}

export async function setToken(token, username) {
  const config = await getConfig();
  config.token = token;
  if (username) {
    config.username = username;
  }
  await saveConfig(config);
}

export async function clearConfig() {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify({
    registry: DEFAULT_REGISTRY,
    token: null
  }, null, 2));
}
