import React from 'react';
import { useStore } from '../lib/store.jsx';
import { dailyMood, normalizeProfile } from '../lib/profile.js';
import { todayKey } from '../lib/time.js';
import Avatar from './Avatar.jsx';
import Icon from './Icons.jsx';

export default function PersonalWelcome({ onEditProfile }) {
  const { settings, updateSettings } = useStore();
  const day = todayKey();
  const offset = settings.moodCard?.day === day ? settings.moodCard.offset || 0 : 0;
  const profile = normalizeProfile(settings.profile);
  return (
    <section className="personal-welcome" aria-label="个人欢迎页">
      <div className="personal-greeting">
        <button
          type="button"
          className="welcome-avatar-button"
          aria-label="修改头像和昵称"
          onClick={onEditProfile}
        >
          <Avatar profile={profile} />
        </button>
        <h2>{profile.nickname}</h2>
        <p className="daily-mood" key={`${day}-${offset}`}>
          {dailyMood(day, offset).replace(/([，？])/, '$1\n')}
        </p>
        <button
          type="button"
          className="mood-refresh"
          onClick={() => updateSettings({ moodCard: { day, offset: offset + 1 } })}
        >
          <Icon name="refresh" size={12} />
          换一句
        </button>
      </div>
    </section>
  );
}
