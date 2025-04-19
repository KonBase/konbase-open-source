// Configuration storage for application settings
// This file provides utilities for storing and retrieving configuration

export interface SupabaseConfig {
  url: string;
  key: string;
  configured: boolean;
}

const CONFIG_KEY = 'konbase_config';

// Load configuration from localStorage
export function loadConfig(): SupabaseConfig | null {
  try {
    const configStr = localStorage.getItem(CONFIG_KEY);
    if (!configStr) return null;
    
    return JSON.parse(configStr) as SupabaseConfig;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return null;
  }
}

// Save configuration to localStorage
export function saveConfig(config: SupabaseConfig): boolean {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save configuration:', error);
    return false;
  }
}

// Check if application is configured
export function isConfigured(): boolean {
  const config = loadConfig();
  return !!config?.configured;
}

// Clear configuration
export function clearConfig(): boolean {
  try {
    localStorage.removeItem(CONFIG_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear configuration:', error);
    return false;
  }
}
