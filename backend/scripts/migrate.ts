import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { saveVideoMeta } from '../src/services/videoStore.js';

const DATA_DIR = path.resolve(import.meta.dirname, '../data/videos');

async function main() {
  console.log('Starting migration to SQLite...');
  
  let entries;
  try {
    entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  } catch (err) {
    console.log('No data directory found. Skipping migration.');
    return;
  }

  let migrated = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const metaPath = path.join(DATA_DIR, entry.name, 'meta.json');
    try {
      const content = await fs.readFile(metaPath, 'utf-8');
      const meta = JSON.parse(content);
      
      await saveVideoMeta(meta.videoId, meta);
      console.log(`✅ Migrated video: ${meta.title}`);
      
      // Rename meta.json to meta.json.bak
      await fs.rename(metaPath, metaPath + '.bak');
      migrated++;
    } catch (err) {
      console.log(`⚠️ Skipped ${entry.name}: no meta.json or error (${err})`);
    }
  }

  console.log(`\n🎉 Migration complete. Migrated ${migrated} videos.`);
}

main().catch(console.error);
