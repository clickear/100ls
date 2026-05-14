import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SEED_PATTERNS, rescanAllVideos } from '../../src/services/patternService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/100ls.db');

console.log('🚀 Starting Full Pattern Recovery...');
console.log('📦 Using core pattern library (220+ phrases)');

async function run() {
  try {
    const result = await rescanAllVideos();
    console.log(`\n✅ Recovery complete!`);
    console.log(`📹 Videos processed: ${result.videoCount}`);
    console.log(`✨ Pattern instances restored: ${result.instanceCount}`);
  } catch (error) {
    console.error('❌ Recovery failed:', error);
  }
}

run();
