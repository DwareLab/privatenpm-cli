import fetch from 'node-fetch';
import { getConfig } from './config.js';

export async function apiRequest(endpoint, options = {}) {
  const config = await getConfig();
  const url = `${config.registry}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  return response;
}

export async function getPackageMetadata(packageName) {
  const response = await apiRequest(`/${encodeURIComponent(packageName)}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch package: ${response.statusText}`);
  }
  
  return response.json();
}

export async function downloadTarball(url) {
  const config = await getConfig();
  const headers = {};
  
  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to download tarball: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
