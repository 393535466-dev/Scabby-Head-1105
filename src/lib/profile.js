import { todayKey } from './time.js';

export const AVATAR_TEMPLATES = [
  '刺刺头',
  '乖乖头',
  '丸子头',
  '卷卷头',
  '中分头',
  '棒球帽',
  '双马尾',
  '翘翘头',
  '金发头',
];
export const DEFAULT_PROFILE = {
  nickname: '脑袋空空',
  avatarIndex: 1,
  avatarDataUrl: '',
  avatarStyle: '',
  created: false,
};

export function normalizeProfile(value) {
  const profile = value && typeof value === 'object' ? value : {};
  const avatarDataUrl = typeof profile.avatarDataUrl === 'string' &&
    /^data:image\/(jpeg|png|webp);base64,/.test(profile.avatarDataUrl) ? profile.avatarDataUrl : '';
  return {
    nickname:
      typeof profile.nickname === 'string' && profile.nickname.trim()
        ? profile.nickname.trim().slice(0, 16)
        : DEFAULT_PROFILE.nickname,
    avatarIndex:
      Number.isInteger(profile.avatarIndex) && profile.avatarIndex >= 0 && profile.avatarIndex < 9
        ? profile.avatarIndex
        : 1,
    avatarDataUrl,
    avatarStyle: avatarDataUrl && profile.avatarStyle === 'chounaozi-3d-v1' ? profile.avatarStyle : '',
    created: Boolean(profile.created),
  };
}

export const DAILY_MOODS = [
  '今天的脑容量，留一半给胡思乱想。',
  '灵感还没来？没关系，先把自己带来。',
  '脑子偶尔短路，也可能是灵感在抄近道。',
  '今天不必想通所有事，想吃什么先想明白。',
  '小事值得记，大事可以慢慢想。',
  '今天也允许自己，做个快乐的半成品。',
  '想法先存着，万一哪天它自己想通了呢。',
  '脑袋不是硬盘，偶尔清空也很正常。',
  '今天的碎碎念，可能是明天的好点子。',
  '不用每一天都闪光，偶尔闪个念头就很好。',
  '好消息：今天的脑洞，不占手机内存。',
  '心里有小剧场？这里正好有空位。',
];

export function dailyMood(day = todayKey(), offset = 0) {
  const number = Math.floor(new Date(`${day}T00:00:00+08:00`).getTime() / 86400000);
  return DAILY_MOODS[
    (((number + offset) % DAILY_MOODS.length) + DAILY_MOODS.length) % DAILY_MOODS.length
  ];
}
