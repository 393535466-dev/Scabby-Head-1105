export const TONES = ['温和', '文艺', '搞笑', '腹黑', '犀利', '极简'];
export const DIRECTIONS = ['正经好用', '无厘头'];
export const DEFAULT_TAGS = [
  '产品灵感',
  '职场吐槽',
  '吃喝探店',
  '旅行散步',
  '生活小事',
  '情绪心事',
];
export const LEGACY_TAGS = {
  点子: '产品灵感',
  日常: '生活小事',
  馋了: '吃喝探店',
  值得记: '重要时刻',
  碎片: '随想片段',
};
export const normalizeTag = (tag) => LEGACY_TAGS[tag] || tag;
export const normalizeTone = (tone) => (tone === '幽默' ? '搞笑' : tone || '温和');
export const TONE_HINTS = {
  温和: '像一个懂你的朋友，好好说。',
  文艺: '给小事一点画面，少一点矫情。',
  搞笑: '日子已经够累了，笑一下再说。',
  腹黑: '表面云淡风轻，心里已经接了三句。',
  犀利: '一针见血，嘴上不绕弯。',
  极简: '能一句说完，就不说两句。',
};

export const DIRECTION_HINT = {
  正经好用: '往能落地的方向推',
  无厘头: '往脑洞和画面感推',
};

export const DEFAULT_SETTINGS = {
  labelSchema: 2,
  defaultTone: '温和',
  defaultDirection: '正经好用',
  tags: [...DEFAULT_TAGS],
  dailyPoster: {},
};

export const TABS = [
  { id: 'record', label: '记录', icon: 'calendar' },
  { id: 'library', label: '灵感库', icon: 'layers' },
];
