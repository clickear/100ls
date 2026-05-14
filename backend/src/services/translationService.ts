import axios from 'axios';

/**
 * AI Translation Service using LLM (Supports OpenAI and Anthropic)
 */
export async function translateSentences(sentences: string[]): Promise<string[]> {
  if (sentences.length === 0) return [];

  const PROVIDER = process.env.TRANSLATION_PROVIDER || 'openai'; // 'openai' or 'anthropic'
  const API_KEY = process.env.TRANSLATION_API_KEY || '';
  const BASE_URL = process.env.TRANSLATION_BASE_URL || (PROVIDER === 'anthropic' ? 'https://api.anthropic.com/v1/messages' : 'https://api.openai.com/v1/chat/completions');
  const MODEL = process.env.TRANSLATION_MODEL || (PROVIDER === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo');

  if (!API_KEY) {
    console.warn(`⚠️ No TRANSLATION_API_KEY found for provider: ${PROVIDER}. Skipping translation.`);
    return sentences.map(() => '');
  }

  const systemPrompt = `You are a professional English-to-Chinese translator for movie subtitles. 
Translate the provided English sentences into natural, idiomatic Chinese. 
Keep the original tone. Return ONLY a JSON array of strings, where each element corresponds to the input sentence at the same index.
Example Input: ["Hello", "How are you?"]
Example Output: ["你好", "你最近怎么样？"]`;

  try {
    let response;
    
    if (PROVIDER === 'anthropic') {
      response = await axios.post(
        BASE_URL,
        {
          model: MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: JSON.stringify(sentences) },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      // Default: OpenAI style
      response = await axios.post(
        BASE_URL,
        {
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(sentences) },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const content = PROVIDER === 'anthropic' 
      ? response.data.content[0].text.trim()
      : response.data.choices[0].message.content.trim();
      
    const translated = JSON.parse(content);

    if (Array.isArray(translated) && translated.length === sentences.length) {
      return translated;
    } else {
      console.error('❌ Translation format error: mismatch in length or not an array');
      return sentences.map(() => '');
    }
  } catch (error) {
    console.error(`❌ ${PROVIDER} Translation failed:`, error);
    return sentences.map(() => '');
  }
}

/**
 * Batch translate sentences to handle API limits and costs efficiently.
 */
export async function batchTranslate(sentences: { en: string }[], batchSize = 20): Promise<string[]> {
  const allResults: string[] = [];
  
  for (let i = 0; i < sentences.length; i += batchSize) {
    const batch = sentences.slice(i, i + batchSize).map(s => s.en);
    console.log(`🌐 Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sentences.length / batchSize)}...`);
    const results = await translateSentences(batch);
    allResults.push(...results);
  }
  
  return allResults;
}
