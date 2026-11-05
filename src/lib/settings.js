import { DEFAULT_SETTINGS, normalizeTag, normalizeTone } from './constants.js';
import { normalizeProfile } from './profile.js';

const KEY = 'chounaozi.settings.v1';

export function loadSettings() {
  try {
    let profile;
    try {
      profile = JSON.parse(window.localStorage.getItem('chounaozi.profile.v1') || 'null');
    } catch {
      /* 使用默认头像 */
    }
    const raw = window.localStorage.getItem(KEY);
    if (!raw)
      return {
        ...DEFAULT_SETTINGS,
        tags: [...DEFAULT_SETTINGS.tags],
        dailyPoster: {},
        profile: normalizeProfile(profile),
      };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      profile: normalizeProfile(profile || parsed.profile),
      defaultTone: normalizeTone(parsed.defaultTone),
      labelSchema: 2,
      tags: [
        ...new Set([
          ...(Array.isArray(parsed.tags) ? parsed.tags.map(normalizeTag) : DEFAULT_SETTINGS.tags),
          ...(parsed.labelSchema === 2 ? [] : DEFAULT_SETTINGS.tags),
        ]),
      ],
      dailyPoster:
        parsed.dailyPoster && typeof parsed.dailyPoster === 'object' ? parsed.dailyPoster : {},
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      tags: [...DEFAULT_SETTINGS.tags],
      dailyPoster: {},
      profile: normalizeProfile(),
    };
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // 隐私模式下可能不可写，忽略即可，内存态仍可用
  }
}
