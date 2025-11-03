/**
 * Simple file-based cache for distribution data
 * Used as fallback when all RPC providers are unavailable
 */

import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const DISTRIBUTIONS_CACHE_FILE = path.join(CACHE_DIR, 'distributions.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours - data is still useful even if slightly stale

export interface CachedDistributionData {
  distributions: any[];
  timestamp: number;
  nextDistributionTime?: number;
}

/**
 * Ensures cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Cache distribution data to file
 */
export function cacheDistributions(data: CachedDistributionData): void {
  try {
    ensureCacheDir();

    const cacheData = {
      ...data,
      timestamp: Date.now()
    };

    fs.writeFileSync(DISTRIBUTIONS_CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log(`💾 Cached ${data.distributions.length} distributions to file`);
  } catch (error) {
    console.warn('⚠️ Failed to cache distributions:', (error as Error).message);
  }
}

/**
 * Get cached distribution data
 * Returns null if cache doesn't exist, is too old, or is invalid
 */
export function getCachedDistributions(): CachedDistributionData | null {
  try {
    if (!fs.existsSync(DISTRIBUTIONS_CACHE_FILE)) {
      console.log('📂 No distribution cache file found');
      return null;
    }

    const cacheContent = fs.readFileSync(DISTRIBUTIONS_CACHE_FILE, 'utf-8');
    const cacheData: CachedDistributionData = JSON.parse(cacheContent);

    // Check if cache is still valid
    const age = Date.now() - cacheData.timestamp;
    if (age > CACHE_TTL) {
      console.log(`⏰ Distribution cache expired (${Math.round(age / 1000 / 60)} minutes old)`);
      return null;
    }

    console.log(`📂 Using cached distributions (${Math.round(age / 1000 / 60)} minutes old, ${cacheData.distributions.length} items)`);
    return cacheData;
  } catch (error) {
    console.warn('⚠️ Failed to read distribution cache:', (error as Error).message);
    return null;
  }
}

/**
 * Clear the distribution cache
 */
export function clearDistributionCache(): void {
  try {
    if (fs.existsSync(DISTRIBUTIONS_CACHE_FILE)) {
      fs.unlinkSync(DISTRIBUTIONS_CACHE_FILE);
      console.log('🗑️ Distribution cache cleared');
    }
  } catch (error) {
    console.warn('⚠️ Failed to clear distribution cache:', (error as Error).message);
  }
}
