import { execSync } from 'child_process';
import { existsSync, copyFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import os from 'os';

const isWindows = os.platform() === 'win32';
const isMac = os.platform() === 'darwin';
const isLinux = os.platform() === 'linux';

function run(command, cwd = process.cwd()) {
  try {
    console.log(`\x1b[36m> Running: ${command}\x1b[0m`);
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (e) {
    return false;
  }
}

function checkCmd(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

async function setup() {
  console.log('\x1b[33m🌟 Golden Majestic 100LS - Environment Setup\x1b[0m\n');

  // 1. Check/Install System Dependencies
  console.log('--- Step 1: Checking System Dependencies ---');
  
  const deps = ['ffmpeg', 'yt-dlp'];
  for (const dep of deps) {
    if (checkCmd(dep)) {
      console.log(`✅ ${dep} is already installed.`);
    } else {
      console.log(`❌ ${dep} is missing.`);
      if (isMac) {
        console.log(`💡 Suggestion: Run 'brew install ${dep}'`);
        // Try to install if brew exists
        if (checkCmd('brew')) {
          console.log(`🚀 Attempting to install ${dep} via Homebrew...`);
          run(`brew install ${dep}`);
        }
      } else if (isWindows) {
        console.log(`💡 Suggestion: Run 'winget install ${dep}'`);
      } else if (isLinux) {
        console.log(`💡 Suggestion: Run 'sudo apt install ${dep}'`);
      }
    }
  }

  // 2. Setup .env files
  console.log('\n--- Step 2: Setting up Environment Files ---');
  const envConfigs = [
    { dir: 'frontend', from: '.env.example', to: '.env' },
    { dir: 'backend', from: '.env.example', to: '.env' }
  ];

  for (const config of envConfigs) {
    const target = join(config.dir, config.to);
    if (!existsSync(target)) {
      console.log(`📄 Creating ${target}...`);
      copyFileSync(join(config.dir, config.from), target);
    } else {
      console.log(`✅ ${target} already exists.`);
    }
  }

  // 4. Download Whisper Model
  console.log('\n--- Step 4: Downloading Whisper Model ---');
  const modelFile = join('backend', 'node_modules', 'whisper-node', 'lib', 'whisper.cpp', 'models', 'ggml-base.en.bin');
  if (!existsSync(modelFile)) {
    console.log('🎙️ Downloading Whisper base.en model...');
    const modelScript = isWindows ? 'download-ggml-model.cmd' : './download-ggml-model.sh';
    const modelDir = join('backend', 'node_modules', 'whisper-node', 'lib', 'whisper.cpp', 'models');
    run(`${modelScript} base.en`, modelDir);
  } else {
    console.log('✅ Whisper model base.en already exists.');
  }

  console.log('\n\x1b[32m✨ Setup completed successfully!\x1b[0m');
  console.log('To start the project, run:');
  console.log('  \x1b[36mnpm run dev\x1b[0m (in both frontend and backend directories)');
}

setup().catch(err => {
  console.error('\x1b[31m💥 Setup failed:\x1b[0m', err);
  process.exit(1);
});
