export const TONES = ['温和', '犀利', '幽默', '文艺', '极简'];
export const DIRECTIONS = ['正经好用', '无厘头'];
export const DEFAULT_TAGS = ['点子', '日常', '馋了', '值得记', '碎片'];

export const DIRECTION_HINT = {
  正经好用: '往能落地的方向推',
  无厘头: '往脑洞和画面感推',
};

export const DEFAULT_SETTINGS = {
  defaultTone: '温和',
  defaultDirection: '正经好用',
  tags: [...DEFAULT_TAGS],
  dailyPoster: {},
};

export const TABS = [
  { id: 'record', label: '记一下', icon: 'note' },
  { id: 'studio', label: '加工台', icon: 'sparkles' },
  { id: 'calendar', label: '日历', icon: 'calendar' },
  { id: 'mine', label: '我的', icon: 'user' },
];
