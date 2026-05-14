import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/100ls.db');
console.log("DB PATH:", dbPath);
const db = new Database(dbPath);

const SEED_PATTERNS = [
  { text: "going to *", description: "将要/打算..." },
  { text: "You know *", description: "你知道..." },
  { text: "take * eyes off *", description: "目不转睛地看..." },
  { text: "the one who *", description: "那个...的人" },
  { text: "screw * up", description: "把...搞砸" }
];

function patternToRegex(pattern) {
  let escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let regexStr = escaped.replace(/ /g, '\\s+');
  regexStr = regexStr.replace(/\\\*/g, '.*?');
  regexStr = regexStr.replace(/\\s\+\.\*\?/g, '\\s*.*?');
  const trailingBoundary = pattern.endsWith('*') ? '' : '\\b';
  return new RegExp(`\\b${regexStr}${trailingBoundary}`, 'i');
}

const COMPILED = SEED_PATTERNS.map(p => ({ ...p, regex: patternToRegex(p.text) }));

db.prepare('DELETE FROM phrase_instances').run();

const videos = db.prepare('SELECT id FROM videos').all();
let total = 0;

for (const video of videos) {
  const sentences = db.prepare('SELECT id, en FROM sentences WHERE videoId = ?').all(video.id);
  for (const s of sentences) {
    for (const p of COMPILED) {
      const match = s.en.match(p.regex);
      if (match) {
        const pRow = db.prepare('SELECT id FROM patterns WHERE text = ?').get(p.text);
        if (pRow) {
          console.log(`MATCH: pattern="${p.text}" sentence="${s.en}" match="${match[0]}"`);
          db.prepare('INSERT INTO phrase_instances (patternId, sentenceId, exactText) VALUES (?, ?, ?)')
            .run(pRow.id, s.id, match[0]);
          total++;
        } else {
          console.log(`MISSING PATTERN IN DB: "${p.text}"`);
        }
      }
    }
  }
}

console.log(`✅ Total found: ${total}`);
