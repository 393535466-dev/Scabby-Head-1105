import { DEFAULT_SETTINGS } from './constants.js';

const KEY = 'chounaozi.settings.v1';

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, tags: [...DEFAULT_SETTINGS.tags], dailyPoster: {} };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [...DEFAULT_SETTINGS.tags],
      dailyPoster: parsed.dailyPoster && typeof parsed.dailyPoster === 'object' ? parsed.dailyPoster : {},
    };
  } catch {
    return { ...DEFAULT_SETTINGS, tags: [...DEFAULT_SETTINGS.tags], dailyPoster: {} };
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // 隐私模式下可能不可写，忽略即可，内存态仍可用
  }
}
