import db from './db.js';
import type { Sentence } from '../types/player.js';

export interface PatternDefinition {
  text: string;
  description: string;
  regex: RegExp;
}

/**
 * Built-in high-frequency English patterns.
 * "*" is used as a wildcard.
 */
const SEED_PATTERNS: { text: string; description: string; category: string }[] = [
  // --- 1. 核心动词短语 (Phrasal Verbs) ---
  { text: "bring up *", description: "提到/养育...", category: "短语动词" },
  { text: "call off *", description: "取消...", category: "短语动词" },
  { text: "carry on *", description: "继续...", category: "短语动词" },
  { text: "check out *", description: "检查/去看看...", category: "短语动词" },
  { text: "come across *", description: "偶然发现/给人以...印象", category: "短语动词" },
  { text: "come up with *", description: "想出/提出...", category: "短语动词" },
  { text: "count on *", description: "指望...", category: "短语动词" },
  { text: "cut down on *", description: "削减/减少...", category: "短语动词" },
  { text: "deal with *", description: "处理...", category: "短语动词" },
  { text: "do over *", description: "重做...", category: "短语动词" },
  { text: "drop by *", description: "顺便访问...", category: "短语动词" },
  { text: "end up *", description: "最终/以...告终", category: "短语动词" },
  { text: "fall apart", description: "崩溃/瓦解", category: "短语动词" },
  { text: "figure out *", description: "弄明白/想出", category: "短语动词" },
  { text: "fill out *", description: "填写(表格)...", category: "短语动词" },
  { text: "find out *", description: "找出/发现", category: "短语动词" },
  { text: "get along with *", description: "与...相处融洽", category: "短语动词" },
  { text: "get over *", description: "克服/从...中恢复", category: "短语动词" },
  { text: "get rid of *", description: "摆脱/丢弃", category: "短语动词" },
  { text: "give up *", description: "放弃...", category: "短语动词" },
  { text: "go on *", description: "继续...", category: "短语动词" },
  { text: "grow up *", description: "成长/长大", category: "短语动词" },
  { text: "hang out *", description: "闲逛/混日子", category: "短语动词" },
  { text: "hold on *", description: "坚持/等一下", category: "短语动词" },
  { text: "keep on *", description: "继续...", category: "短语动词" },
  { text: "look after *", description: "照顾...", category: "短语动词" },
  { text: "look for *", description: "寻找...", category: "短语动词" },
  { text: "look forward to *", description: "期待...", category: "短语动词" },
  { text: "look into *", description: "调查...", category: "短语动词" },
  { text: "look up to *", description: "仰慕/尊敬", category: "短语动词" },
  { text: "make up *", description: "虚构/弥补/化妆", category: "短语动词" },
  { text: "pass out *", description: "昏倒/分发", category: "短语动词" },
  { text: "pick up *", description: "捡起/接人/学会", category: "短语动词" },
  { text: "point out *", description: "指出...", category: "短语动词" },
  { text: "put off *", description: "推迟...", category: "短语动词" },
  { text: "put up with *", description: "忍受...", category: "短语动词" },
  { text: "run into *", description: "偶然碰到...", category: "短语动词" },
  { text: "run out of *", description: "用完/耗尽...", category: "短语动词" },
  { text: "set up *", description: "建立/安装", category: "短语动词" },
  { text: "show up *", description: "出现/露面", category: "短语动词" },
  { text: "take after *", description: "长得像/性格像", category: "短语动词" },
  { text: "take off *", description: "起飞/脱掉/突然成功", category: "短语动词" },
  { text: "think over *", description: "仔细考虑", category: "短语动词" },
  { text: "throw away *", description: "扔掉...", category: "短语动词" },
  { text: "turn down *", description: "拒绝/调小", category: "短语动词" },
  { text: "turn off *", description: "关掉...", category: "短语动词" },
  { text: "turn on *", description: "开启...", category: "短语动词" },
  { text: "turn up *", description: "出现/调大", category: "短语动词" },
  { text: "wake up *", description: "醒来/唤醒", category: "短语动词" },
  { text: "work out *", description: "锻炼/解决/结果为", category: "短语动词" },

  // --- 2. 地道习语 (Idioms) ---
  { text: "piece of cake", description: "小菜一碟", category: "地道习语" },
  { text: "under the weather", description: "身体不适", category: "地道习语" },
  { text: "spill the beans", description: "泄露秘密", category: "地道习语" },
  { text: "break the ice", description: "破冰/打破僵局", category: "地道习语" },
  { text: "call it a day", description: "收工/到此为止", category: "地道习语" },
  { text: "bite the bullet", description: "咬紧牙关/硬着头皮", category: "地道习语" },
  { text: "get out of hand", description: "失去控制", category: "地道习语" },
  { text: "hit the hay", description: "上床睡觉", category: "地道习语" },
  { text: "cut to the chase", description: "开门见山", category: "地道习语" },
  { text: "bark up the wrong tree", description: "搞错对象/找错人", category: "地道习语" },
  { text: "best of both worlds", description: "两全其美", category: "地道习语" },
  { text: "blessing in disguise", description: "因祸得福", category: "地道习语" },
  { text: "break a leg", description: "祝你好运", category: "地道习语" },
  { text: "cost an arm and a leg", description: "价格昂贵", category: "地道习语" },
  { text: "let the cat out of the bag", description: "泄露天机", category: "地道习语" },
  { text: "miss the boat", description: "错过时机", category: "地道习语" },
  { text: "no pain no gain", description: "不劳无获", category: "地道习语" },
  { text: "on the ball", description: "机灵/事事留心", category: "地道习语" },
  { text: "pull yourself together", description: "振作起来", category: "地道习语" },
  { text: "sit on the fence", description: "犹豫不决/观望", category: "地道习语" },
  { text: "through thick and thin", description: "患难与共", category: "地道习语" },
  { text: "once in a blue moon", description: "极少/罕见", category: "地道习语" },
  { text: "beat around the bush", description: "拐弯抹角", category: "地道习语" },
  { text: "burn the midnight oil", description: "熬夜苦干", category: "地道习语" },
  { text: "face the music", description: "承担后果", category: "地道习语" },
  { text: "get cold feet", description: "临阵缩头/害怕", category: "地道习语" },
  { text: "hit the books", description: "用功读书", category: "地道习语" },
  { text: "keep an eye on *", description: "照看/留意...", category: "地道习语" },
  { text: "let someone off the hook", description: "放某人一马", category: "地道习语" },
  { text: "make a long story short", description: "长话短说", category: "地道习语" },
  { text: "on the same page", description: "达成共识", category: "地道习语" },
  { text: "ring a bell", description: "听起来耳熟", category: "地道习语" },
  { text: "steer clear of *", description: "避开...", category: "地道习语" },
  { text: "take it with a grain of salt", description: "半信半疑", category: "地道习语" },
  { text: "up in the air", description: "悬而未决", category: "地道习语" },

  // --- 3. 句首引导与叙事逻辑 (Starters & Connectors) ---
  { text: "As far as I know *", description: "据我所知...", category: "逻辑引导" },
  { text: "Speaking of *", description: "说到...", category: "逻辑引导" },
  { text: "Truth be told *", description: "老实说...", category: "逻辑引导" },
  { text: "In the long run *", description: "从长远来看...", category: "逻辑引导" },
  { text: "For what it's worth *", description: "不管有没有用/总之...", category: "逻辑引导" },
  { text: "It's a matter of time *", description: "只是时间问题...", category: "逻辑引导" },
  { text: "On the other hand *", description: "另一方面...", category: "逻辑引导" },
  { text: "That being said *", description: "话虽如此...", category: "逻辑引导" },
  { text: "To be honest *", description: "诚实地说...", category: "逻辑引导" },
  { text: "In other words *", description: "换句话说...", category: "逻辑引导" },
  { text: "By and large *", description: "总的来说...", category: "逻辑引导" },
  { text: "First of all *", description: "首先...", category: "逻辑引导" },
  { text: "Last but not least *", description: "最后但同样重要...", category: "逻辑引导" },
  { text: "So far so good", description: "目前为止一切都好", category: "逻辑引导" },
  { text: "Without a doubt *", description: "毫无疑问...", category: "逻辑引导" },
  { text: "As it turns out *", description: "结果证明...", category: "逻辑引导" },
  { text: "It occurs to me that *", description: "我突然想到...", category: "逻辑引导" },
  { text: "Believe it or not *", description: "信不信由你...", category: "逻辑引导" },
  { text: "I mean *", description: "我的意思是...", category: "逻辑引导" },
  { text: "You know *", description: "你知道...", category: "逻辑引导" },
  { text: "Anyway *", description: "不管怎样...", category: "逻辑引导" },
  { text: "In case *", description: "以防万一...", category: "逻辑引导" },
  { text: "Frankly speaking *", description: "坦白说...", category: "逻辑引导" },
  { text: "In fact *", description: "事实上...", category: "逻辑引导" },

  // --- 4. 核心时态、情态与结构 (Tense & Structure) ---
  { text: "I was *", description: "我当时正在/当时是...", category: "核心结构" },
  { text: "used to *", description: "过去常常...", category: "核心结构" },
  { text: "be about to *", description: "正要/即将...", category: "核心结构" },
  { text: "be supposed to *", description: "应该/本该...", category: "核心结构" },
  { text: "be able to *", description: "能够...", category: "核心结构" },
  { text: "be willing to *", description: "愿意...", category: "核心结构" },
  { text: "be likely to *", description: "很可能...", category: "核心结构" },
  { text: "had better *", description: "最好...", category: "核心结构" },
  { text: "would rather *", description: "宁愿...", category: "核心结构" },
  { text: "It's high time *", description: "该是...的时候了", category: "核心结构" },
  { text: "I was wondering if *", description: "我在想是否...", category: "核心结构" },
  { text: "not only * but also *", description: "不仅...而且...", category: "核心结构" },
  { text: "the more * the more *", description: "越...就越...", category: "核心结构" },
  { text: "rather than *", description: "而不是...", category: "核心结构" },
  { text: "instead of *", description: "代替/而不是...", category: "核心结构" },
  { text: "no matter *", description: "无论...", category: "核心结构" },
  { text: "in order to *", description: "为了...", category: "核心结构" },
  { text: "It takes * to *", description: "花某人...去做...", category: "核心结构" },
  { text: "It depends on *", description: "取决于...", category: "核心结构" },
  { text: "Would you mind *", description: "你介意...吗？", category: "核心结构" },
  { text: "What if *", description: "如果...怎么办？", category: "核心结构" },
  { text: "What about *", description: "那...怎么样？", category: "核心结构" },
  { text: "How come *", description: "怎么会...？", category: "核心结构" },
  { text: "take * eyes off *", description: "目不转睛地看...", category: "核心结构" },
  { text: "the one who *", description: "那个...的人", category: "核心结构" },

  // --- 5. 从现有视频提取的特定句型 (Library Specific) ---
  { text: "going to *", description: "将要/打算...", category: "口语常用" },
  { text: "before I was *", description: "在我...之前", category: "口语常用" },
  { text: "make it as *", description: "作为...获得成功", category: "口语常用" },
  { text: "screw * up", description: "把...搞砸", category: "口语常用" },
  { text: "Thanks for *ing", description: "谢谢你做...", category: "口语常用" },
  { text: "are you kidding", description: "你在开玩笑吗", category: "口语常用" },
  { text: "have been there for *", description: "经历过/见证过...", category: "口语常用" },
  { text: "have a thing for *", description: "对...情有独钟/有好感", category: "口语常用" },
  { text: "suit up", description: "穿上正装/打扮起来", category: "口语常用" },
  { text: "put on *", description: "穿上/戴上...", category: "口语常用" },
  { text: "go with *", description: "与...相配", category: "口语常用" },
  { text: "take a while", description: "花点时间/需要一段时间", category: "口语常用" },
  { text: "It's no big deal", description: "没什么大不了的", category: "口语常用" },
  { text: "I wish *", description: "我希望...", category: "口语常用" },
  { text: "look at *", description: "看着...", category: "口语常用" },
  { text: "get married", description: "结婚", category: "口语常用" },
  { text: "start a family", description: "成家", category: "口语常用" },
  { text: "lose the *", description: "丢掉/别再带(那个)...", category: "口语常用" }
];

/**
 * Convert a pattern with wildcards (*) into a regex.
 */
function patternToRegex(pattern: string): RegExp {
  // 1. Escape ALL special regex characters first (including *)
  let escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // 2. Convert spaces to flexible whitespace (\s+)
  let regexStr = escaped.replace(/ /g, '\\s+');
  
  // 3. Convert the escaped wildcard (\*) into a non-greedy match (.*?)
  regexStr = regexStr.replace(/\\\*/g, '.*?');
  
  // 4. Optimization: if we have flex-space followed by wildcard (\s+.*?),
  // make the space optional (\s*.*?) to handle "You know," matching "You know *"
  regexStr = regexStr.replace(/\\s\+\.\*\?/g, '\\s*.*?');

  // Match case-insensitively. Use word boundary at start.
  const trailingBoundary = pattern.endsWith('*') ? '' : '\\b';
  return new RegExp(`\\b${regexStr}${trailingBoundary}`, 'i');
}

const COMPILED_PATTERNS: PatternDefinition[] = SEED_PATTERNS.map(p => ({
  ...p,
  regex: patternToRegex(p.text)
}));

/**
 * Initialize patterns in the database if they don't exist.
 */
export async function initPatterns(): Promise<void> {
  const insert = db.prepare('INSERT OR IGNORE INTO patterns (text, description, category) VALUES (?, ?, ?)');
  const update = db.prepare('UPDATE patterns SET category = ? WHERE text = ?');
  
  const transaction = db.transaction((patterns: typeof SEED_PATTERNS) => {
    for (const p of patterns) {
      const result = insert.run(p.text, p.description, p.category);
      // If ignore happened (no changes), still try to update the category in case it changed in seed
      if (result.changes === 0) {
        update.run(p.category, p.text);
      }
    }
  });
  transaction(SEED_PATTERNS);
}

/**
 * Scan a list of sentences for patterns and save instances to the DB.
 */
export async function scanSentencesForPatterns(videoId: string, sentences: Sentence[]): Promise<void> {
  // 1. Ensure seed patterns exist in DB
  await initPatterns();

  // 2. Clear old instances for THIS video only to avoid duplicates
  db.prepare(`
    DELETE FROM phrase_instances 
    WHERE sentenceId IN (SELECT id FROM sentences WHERE videoId = ?)
  `).run(videoId);

  // 3. Fetch all patterns from DB to get IDs
  const allPatterns = db.prepare('SELECT id, text FROM patterns').all() as { id: number; text: string }[];
  
  // Create a map for quick lookup
  const patternMap = new Map<string, number>();
  allPatterns.forEach(p => patternMap.set(p.text, p.id));

  // 3. Scan sentences
  const insertInstance = db.prepare(`
    INSERT INTO phrase_instances (patternId, sentenceId, exactText)
    VALUES (?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const sentence of sentences) {
      // sentences table uses 0-based sentenceIndex
      const sentenceIndex = sentence.id - 1;
      const dbSentence = db.prepare('SELECT id FROM sentences WHERE videoId = ? AND sentenceIndex = ?')
        .get(videoId, sentenceIndex) as { id: number } | undefined;
      
      if (!dbSentence) {
        console.warn(`⚠️ Sentence not found in DB: videoId=${videoId}, index=${sentenceIndex}`);
        continue;
      }

      for (const pattern of COMPILED_PATTERNS) {
        const match = sentence.en.match(pattern.regex);
        if (match) {
          const patternId = patternMap.get(pattern.text);
          if (patternId) {
            insertInstance.run(patternId, dbSentence.id, match[0]);
          }
        }
      }
    }
  });

  transaction();
  console.log(`🔍 Pattern scan complete for video ${videoId}`);
}

/**
 * Get all identified patterns across all videos.
 */
export function getAllPatterns() {
  return db.prepare(`
    SELECT p.*, COUNT(pi.id) as count, p.mastery_xp as masteryXp
    FROM patterns p
    JOIN phrase_instances pi ON p.id = pi.patternId
    GROUP BY p.id
    ORDER BY p.mastery_xp DESC, count DESC
  `).all();
}

/**
 * Increment mastery XP for a pattern.
 */
export function incrementPatternMastery(patternId: number, xp: number = 1): void {
  db.prepare('UPDATE patterns SET mastery_xp = mastery_xp + ? WHERE id = ?').run(xp, patternId);
}

/**
 * Get all instances of a specific pattern.
 */
export function getPatternInstances(patternId: number) {
  return db.prepare(`
    SELECT pi.*, s.en, s.startTime, s.endTime, v.title as videoTitle, v.id as videoId
    FROM phrase_instances pi
    JOIN sentences s ON pi.sentenceId = s.id
    JOIN videos v ON s.videoId = v.id
    WHERE pi.patternId = ?
    ORDER BY v.importedAt DESC
  `).all(patternId);
}

/**
 * Re-scan all existing videos and sentences in the database.
 */
export async function rescanAllVideos(): Promise<{ videoCount: number; instanceCount: number }> {
  // 1. Ensure patterns exist (uses INSERT OR IGNORE)
  await initPatterns();

  // 2. Get all videos
  const videos = db.prepare('SELECT id FROM videos').all() as { id: string }[];
  
  // 3. Clear existing instances for a clean scan, but keep the patterns table
  db.prepare('DELETE FROM phrase_instances').run();
  
  let totalInstances = 0;
  for (const video of videos) {
    // A. Fix missing translations first
    const missingRows = db.prepare('SELECT id, en FROM sentences WHERE videoId = ? AND (cn IS NULL OR cn = \'\')').all(video.id) as any[];
    if (missingRows.length > 0) {
      console.log(`🌐 Found ${missingRows.length} sentences missing translation for video ${video.id}. Translating...`);
      try {
        const { batchTranslate } = await import('./translationService.js');
        const translations = await batchTranslate(missingRows.map(r => ({ en: r.en })));
        
        const updateCn = db.prepare('UPDATE sentences SET cn = ? WHERE id = ?');
        db.transaction(() => {
          translations.forEach((cn, i) => {
            if (cn) updateCn.run(cn, missingRows[i].id);
          });
        })();
        console.log(`✅ Translation backfill complete for ${video.id}`);
      } catch (err) {
        console.error(`⚠️ Translation backfill failed for ${video.id}:`, err);
      }
    }

    // B. Perform pattern scan
    const sentencesRows = db.prepare('SELECT id, sentenceIndex, en FROM sentences WHERE videoId = ?').all(video.id) as any[];
    
    // Map to the internal Sentence format (simplified for scanning)
    const sentences = sentencesRows.map(row => ({
      id: row.sentenceIndex, // Our scan logic uses 0-based index which matches sentenceIndex
      en: row.en
    }));

    // Perform scan
    // Note: We adjust the scan function slightly to use the raw DB IDs directly for efficiency
    const allPatterns = db.prepare('SELECT id, text FROM patterns').all() as { id: number; text: string }[];
    const patternMap = new Map<string, number>();
    allPatterns.forEach(p => patternMap.set(p.text, p.id));

    const insertInstance = db.prepare(`
      INSERT INTO phrase_instances (patternId, sentenceId, exactText)
      VALUES (?, ?, ?)
    `);

    db.transaction(() => {
      for (const row of sentencesRows) {
        for (const pattern of COMPILED_PATTERNS) {
          const match = row.en.match(pattern.regex);
          if (match) {
            const patternId = patternMap.get(pattern.text);
            if (patternId) {
              insertInstance.run(patternId, row.id, match[0]);
              totalInstances++;
            }
          }
        }
      }
    })();
  }

  return { videoCount: videos.length, instanceCount: totalInstances };
}
