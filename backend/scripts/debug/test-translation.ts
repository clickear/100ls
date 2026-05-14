import 'dotenv/config';
import { translateSentences } from '../../src/services/translationService.js';

async function verifyTranslation() {
  console.log('🚀 Starting Translation Verification...');
  console.log(`📡 Provider: ${process.env.TRANSLATION_PROVIDER}`);
  console.log(`🤖 Model: ${process.env.TRANSLATION_MODEL}`);
  console.log(`🔗 Base URL: ${process.env.TRANSLATION_BASE_URL}`);

  const testSentences = [
    "Challenge accepted!",
    "It's going to be legendary.",
    "Suit up!",
    "I have a thing for you."
  ];

  console.log('\n📝 Input English sentences:');
  testSentences.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  try {
    console.log('\n⏳ Calling API...');
    const startTime = Date.now();
    const results = await translateSentences(testSentences);
    const duration = Date.now() - startTime;

    if (results.some(r => r !== '')) {
      console.log(`✅ Success! (Time taken: ${duration}ms)`);
      console.log('\n🈴 Translated Chinese:');
      results.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
    } else {
      console.error('❌ Failed: Received empty translations. Check your API key and network.');
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

verifyTranslation();
