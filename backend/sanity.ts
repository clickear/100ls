import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'data', '100ls.db');
console.log("DB PATH:", dbPath);
const db = new Database(dbPath);

const count = db.prepare('SELECT COUNT(*) as c FROM phrase_instances').get().c;
console.log("BEFORE COUNT:", count);

db.prepare('INSERT INTO phrase_instances (patternId, sentenceId, exactText) VALUES (1, 1, "test")').run();

const count2 = db.prepare('SELECT COUNT(*) as c FROM phrase_instances').get().c;
console.log("AFTER COUNT:", count2);
