import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SEED_PATTERNS, rescanAllVideos } from '../../src/services/patternService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/100ls.db');
console.log('🔍 ACTUAL DB PATH USED BY SCRIPT:', dbPath);

console.log('🚀 Starting Full Pattern Recovery...');
console.log('📦 Using core pattern library (220+ phrases)');

async function run() {
  try {
    const result = await rescanAllVideos();
    console.log(`\n✅ Recovery complete!`);
    console.log(`📹 Videos processed: ${result.videoCount}`);
    console.log(`✨ Pattern instances restored: ${result.instanceCount}`);

    // Immediate verification
    const { default: db } = await import('../../src/services/db.js');
    const count = db.prepare('SELECT count(*) as count FROM phrase_instances').get() as { count: number };
    console.log(`🔍 Immediate DB Check: ${count.count} rows found in phrase_instances`);

    // Force checkpoint and close to ensure data is written to disk
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    console.log('💾 Database closed and checkpointed.');

  } catch (error) {
    console.error('❌ Recovery failed:', error);
  }
}

run();
