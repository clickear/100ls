import { getStorageProvider } from '../../src/services/storageService.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import 'dotenv/config';

async function testQiniuUpload() {
  console.log('🚀 Starting Qiniu Upload Test...');
  
  const provider = process.env.STORAGE_PROVIDER;
  if (provider !== 'qiniu') {
    console.error('❌ Error: STORAGE_PROVIDER is not set to "qiniu" in .env');
    return;
  }

  // 1. Create a dummy test file
  const testFilePath = path.resolve('test-upload.txt');
  const content = `Test upload at ${new Date().toISOString()}`;
  fs.writeFileSync(testFilePath, content);
  
  console.log(`📝 Created test file: ${testFilePath}`);

  try {
    const storage = getStorageProvider();
    
    // 2. Attempt upload
    // We use a unique key to avoid collisions
    const key = `debug/test-${Date.now()}.txt`;
    console.log(`⏳ Uploading to Qiniu as: ${key}...`);
    
    const url = await storage.uploadFile(testFilePath, key);
    
    console.log('\n✅ Upload Successful!');
    console.log(`🔗 Public URL: ${url}`);
    console.log('\nPlease check the link in your browser to verify.');

  } catch (err) {
    console.error('\n❌ Upload Failed:');
    console.error(err);
  } finally {
    // 3. Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Cleaned up local test file.');
    }
  }
}

testQiniuUpload();
