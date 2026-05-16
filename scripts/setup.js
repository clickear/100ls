import { execSync } from 'child_process';
import { existsSync, copyFileSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import readline from 'readline';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

async function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function checkCmd(cmd) {
  try {
    const versionCmd = cmd === 'ffmpeg' ? `${cmd} -version` : `${cmd} --version`;
    execSync(versionCmd, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`  📁 Created directory: ${dir}`, colors.green);
  }
}

async function installDependency(dep) {
  const platform = os.platform();
  log(`\n📦 Attempting to install ${dep}...`, colors.cyan);

  try {
    if (platform === 'darwin') {
      if (checkCmd('brew')) {
        log(`  🍺 Using Homebrew to install ${dep}...`, colors.blue);
        execSync(`brew install ${dep}`, { stdio: 'inherit' });
        return true;
      }
    } else if (platform === 'linux') {
      if (checkCmd('apt-get')) {
        log(`  🐧 Using apt-get to install ${dep}...`, colors.blue);
        execSync(`sudo apt-get update && sudo apt-get install -y ${dep}`, { stdio: 'inherit' });
        return true;
      } else if (checkCmd('yum')) {
        log(`  🐧 Using yum to install ${dep}...`, colors.blue);
        execSync(`sudo yum install -y ${dep}`, { stdio: 'inherit' });
        return true;
      }
    } else if (platform === 'win32') {
      if (checkCmd('choco')) {
        log(`  🪟 Using Chocolatey to install ${dep}...`, colors.blue);
        execSync(`choco install ${dep} -y`, { stdio: 'inherit' });
        return true;
      }
    }
  } catch (e) {
    log(`  ❌ Auto-installation of ${dep} failed.`, colors.red);
  }

  log(`\n⚠️  Could not automatically install ${dep}.`, colors.yellow);
  log(`💡 Please install it manually:`, colors.bright);
  if (platform === 'darwin') log('   - Run: brew install ffmpeg yt-dlp');
  if (platform === 'linux') log('   - Run: sudo apt-get install ffmpeg yt-dlp');
  if (platform === 'win32') log('   - Download from official websites or use "choco install"');
  
  const cont = await ask('Have you installed it manually and want to continue? (y/N):');
  return cont.toLowerCase() === 'y' || cont.toLowerCase() === 'yes';
}

async function setup() {
  log('\n🌟 Golden Majestic 100LS - Ultimate Environment Setup', colors.magenta + colors.bright);
  log('====================================================\n', colors.magenta);

  // 1. Node.js Version Check
  const nodeVersion = process.versions.node.split('.')[0];
  if (parseInt(nodeVersion) < 18) {
    log(`❌ Required Node.js version >= 18. Current version: ${process.version}`, colors.red);
    process.exit(1);
  }

  // 2. Check System Dependencies
  log('--- Step 1: Checking System Dependencies ---', colors.cyan);
  const deps = ['ffmpeg', 'yt-dlp'];

  for (const dep of deps) {
    if (checkCmd(dep)) {
      log(`  ✅ ${dep.padEnd(10)} - Installed.`, colors.green);
    } else {
      log(`  ❌ ${dep.padEnd(10)} - NOT FOUND!`, colors.red);
      const confirmed = await ask(`Do you want to attempt automatic installation of ${dep}? (y/N):`);
      if (confirmed.toLowerCase() === 'y' || confirmed.toLowerCase() === 'yes') {
        const success = await installDependency(dep);
        if (!success && dep === 'ffmpeg') {
          log('🛑 ffmpeg is mandatory for this project. Please install it to proceed.', colors.red);
          process.exit(1);
        }
      } else {
        log(`Skipping ${dep} installation. Some features may not work.`, colors.yellow);
      }
    }
  }
  console.log();

  // 3. Ensure Directory Structure
  log('--- Step 2: Initializing Directory Structure ---', colors.cyan);
  const dirs = [
    'backend/data',
    'backend/media',
    'frontend/public/static-data/player',
    'frontend/public/static-data/media'
  ];
  dirs.forEach(ensureDir);
  console.log();

  // 4. Setup Environment Files
  log('--- Step 3: Setting up Environment Files ---', colors.cyan);
  const envConfigs = [
    { from: 'backend/.env.example', to: 'backend/.env' },
    { from: 'frontend/.env.example', to: 'frontend/.env' }
  ];

  envConfigs.forEach(cfg => {
    if (!existsSync(cfg.to)) {
      if (existsSync(cfg.from)) {
        copyFileSync(cfg.from, cfg.to);
        log(`  ✅ Created ${cfg.to} from template.`, colors.green);
      }
    } else {
      log(`  ℹ️  ${cfg.to} already exists.`, colors.blue);
    }
  });
  console.log();

  const backendEnvPath = 'backend/.env';
  let backendEnv = readFileSync(backendEnvPath, 'utf8');
  let envModified = false;

  // Step 4: Translation Config
  log('--- Step 4: AI Translation Service (Optional) ---', colors.cyan);
  log('💡 Used for AI translation and grammar analysis.', colors.reset);
  log('💡 If skipped, you can still import videos and study with English subtitles.', colors.reset);
  const setupTranslation = await ask('Configure Translation API now? (y/N):');
  
  if (setupTranslation.toLowerCase() === 'y' || setupTranslation.toLowerCase() === 'yes') {
    log('\n--- 🤖 AI Translation Settings ---', colors.magenta + colors.bright);
    const provider = await ask('Choose Provider (openai/deepseek) [openai]:') || 'openai';
    const apiKey = await ask(`Enter your ${provider === 'openai' ? 'OpenAI' : 'DeepSeek'} API Key:`);
    const model = await ask(`Enter Model name (default: ${provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat'}):`);

    if (apiKey) {
      backendEnv = backendEnv.replace(/TRANSLATION_PROVIDER=.*/, `TRANSLATION_PROVIDER=${provider}`);
      backendEnv = backendEnv.replace(/TRANSLATION_API_KEY=.*/, `TRANSLATION_API_KEY=${apiKey}`);
      const finalModel = model || (provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat');
      backendEnv = backendEnv.replace(/TRANSLATION_MODEL=.*/, `TRANSLATION_MODEL=${finalModel}`);
      
      if (provider === 'deepseek') {
        backendEnv = backendEnv.replace(/TRANSLATION_BASE_URL=.*/, `TRANSLATION_BASE_URL=https://api.deepseek.com/v1`);
      }
      envModified = true;
    }
  }
  console.log();

  // Step 5: Media Storage (Optional)
  log('--- Step 5: Media Storage (Optional) ---', colors.cyan);
  log('💡 Local: Default mode. Best for private study. Videos stay on your disk.', colors.reset);
  log('💡 Qiniu: Required ONLY if you want videos to work on GitHub Pages via CI/CD.', colors.reset);
  
  const useCloud = await ask('Switch to Cloud Storage (Qiniu)? (y/N) [Default: Local]:');

  if (useCloud.toLowerCase() === 'y' || useCloud.toLowerCase() === 'yes') {
    log('\n--- ☁️ Qiniu Cloud Storage Settings ---', colors.magenta + colors.bright);
    backendEnv = backendEnv.replace(/STORAGE_PROVIDER=.*/, 'STORAGE_PROVIDER=qiniu');
    
    log('Please provide your Qiniu OSS credentials:', colors.cyan);
    const ak = await ask('  AccessKey :');
    const sk = await ask('  SecretKey :');
    const bucket = await ask('  Bucket Name:');
    const domain = await ask('  Domain URL (e.g., http://media.yourdomain.com):');

    if (ak) backendEnv = backendEnv.replace(/STORAGE_QINIU_AK=.*/, `STORAGE_QINIU_AK=${ak}`);
    if (sk) backendEnv = backendEnv.replace(/STORAGE_QINIU_SK=.*/, `STORAGE_QINIU_SK=${sk}`);
    if (bucket) backendEnv = backendEnv.replace(/STORAGE_QINIU_BUCKET=.*/, `STORAGE_QINIU_BUCKET=${bucket}`);
    if (domain) backendEnv = backendEnv.replace(/STORAGE_QINIU_DOMAIN=.*/, `STORAGE_QINIU_DOMAIN=${domain}`);
    envModified = true;
  } else {
    log('  ℹ️  Using Local Storage.', colors.blue);
    log('  ⚠️  Note: Videos will NOT be available on GitHub Pages if deployed via GitHub Actions.', colors.yellow);
    if (!backendEnv.includes('STORAGE_PROVIDER=local')) {
      backendEnv = backendEnv.replace(/STORAGE_PROVIDER=.*/, 'STORAGE_PROVIDER=local');
      envModified = true;
    }
  }
  console.log();

  if (envModified) {
    writeFileSync(backendEnvPath, backendEnv);
    log('✅ Configuration saved to backend/.env!\n', colors.green + colors.bright);
  }

  // 6. Download Whisper Model
  log('--- Step 6: Downloading AI Models (Whisper) ---', colors.cyan);
  const modelName = 'base.en';
  const modelInternalPath = join('backend/node_modules/whisper-node/lib/whisper.cpp/models/ggml-base.en.bin');
  
  if (!existsSync(modelInternalPath)) {
    log(`  📥 Downloading Whisper ${modelName} model...`, colors.yellow);
    try {
      execSync(`npx whisper-node download ${modelName}`, { stdio: 'inherit' });
      log('  ✅ Model downloaded successfully.', colors.green);
    } catch (e) {
      log('  ❌ Failed to download model automatically.', colors.red);
    }
  } else {
    log(`  ✅ Whisper model ${modelName} already exists in node_modules.`, colors.green);
  }
  console.log();

  log('====================================================', colors.magenta);
  log('✨ Setup completed successfully!', colors.green + colors.bright);
  log('\nEnjoy your 100LS journey! 🎬\n', colors.cyan);
}

setup().catch(err => {
  console.error('\n❌ Setup failed unexpectedly:', err);
  process.exit(1);
});
