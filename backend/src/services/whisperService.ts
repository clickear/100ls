import ffmpeg from 'fluent-ffmpeg';
import * as path from 'node:path';
// @ts-ignore
import whisperNode from 'whisper-node';
const whisper = whisperNode.whisper || whisperNode.default || whisperNode;


export interface WhisperSegment {
  start: string; // e.g. "00:00:01.000" or seconds
  end: string;
  speech: string;
}

/**
 * Extract 16kHz WAV audio from a video file.
 * whisper.cpp requires 16kHz WAV format.
 */
export async function extractAudio(videoPath: string, outputWavPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .toFormat('wav')
      .audioFrequency(16000)
      .audioChannels(1)
      .on('end', () => resolve(outputWavPath))
      .on('error', (err) => reject(err))
      .save(outputWavPath);
  });
}

/**
 * Run local Whisper model to transcribe an audio file.
 */
export async function transcribeAudio(wavPath: string): Promise<WhisperSegment[]> {
  console.log(`🎙️ Starting Whisper transcription for: ${wavPath}`);
  
  const options = {
    modelName: "base.en", // Using base english model for speed and good accuracy
    whisperOptions: {
      language: 'en',
      gen_file_txt: false,
      gen_file_subtitle: false,
      gen_file_vtt: false,
      word_timestamps: false
    }
  };

  try {
    const transcript = await whisper(wavPath, options);
    
    if (!transcript) {
      throw new Error(`Whisper returned undefined. Please ensure the whisper model is downloaded and ffmpeg is working.`);
    }

    console.log(`✅ Whisper transcription complete.`);
    
    // transcript is usually an array of segments like:
    // [{ start: '00:00:00.000', end: '00:00:02.500', speech: ' Hello world' }, ...]
    return transcript as WhisperSegment[];
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error);
    throw error;
  }
}
