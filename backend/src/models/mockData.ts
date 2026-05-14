import type { PlayerData } from '../types/player.js';

export const mockPlayerData: PlayerData = {
  videoId: 'sunset-001',
  title: '落日与晚风',
  isVip: true,
  videoUrl: '/demo.mp4',
  thumbnailUrl: '/sunset.png',
  duration: 10,
  stageInfo: {
    currentStage: 4,
    totalStages: 10,
    subtitleMode: '纯英文字幕',
    currentProgress: 36,
    totalProgress: 100,
    repetitionCount: 5,
    lastPosition: 0,
  },
  episodes: [
    { number: 1, status: 'completed' },
    { number: 2, status: 'completed' },
    { number: 3, status: 'completed' },
    { number: 4, status: 'active' },
    { number: 5, status: 'locked' },
    { number: 6, status: 'locked' },
    { number: 7, status: 'locked' },
    { number: 8, status: 'locked' },
    { number: 9, status: 'locked' },
    { number: 10, status: 'locked' },
  ],
  sentences: [
    { id: 1, en: 'The sunset was like a painting in the sky.', cn: '这落日就像是天空中的一幅画。', keywords: ['sunset', 'painting'], startTime: 0, endTime: 2, isKey: false },
    { id: 2, en: 'The wind was gentle, blowing through the trees and grass.', cn: '微风轻轻吹过树木和草地。', keywords: ['gentle', 'blowing', 'through'], startTime: 2, endTime: 4, isKey: true },
    { id: 3, en: 'She sat quietly, watching the colors change.', cn: '她安静地坐着，看着颜色变化。', keywords: ['quietly', 'watching', 'change'], startTime: 4, endTime: 6, isKey: false },
    { id: 4, en: 'The sky turned from orange to deep purple.', cn: '天空从橙色变成了深紫色。', keywords: ['turned', 'orange', 'purple'], startTime: 6, endTime: 8, isKey: true },
    { id: 5, en: 'Birds flew home as the light faded away.', cn: '鸟儿在光线消退时飞回了家。', keywords: ['flew', 'faded'], startTime: 8, endTime: 10, isKey: false },
  ],
  abLoop: { active: true, startTime: 2, endTime: 6 },
};
