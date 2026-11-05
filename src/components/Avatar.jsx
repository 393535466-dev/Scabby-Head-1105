import React, { useEffect, useState } from 'react';
import { normalizeProfile, AVATAR_TEMPLATES } from '../lib/profile.js';
import { avatarTemplate } from '../lib/avatarImage.js';

export default function Avatar({ profile, className = '', decorative = false }) {
  const value = normalizeProfile(profile);
  const [failedUrl, setFailedUrl] = useState('');
  const [template, setTemplate] = useState(null);
  useEffect(() => {
    let active = true;
    avatarTemplate(value.avatarIndex)
      .then((url) => {
        if (active) setTemplate({ index: value.avatarIndex, url });
      })
      .catch(() => {
        if (active) setTemplate(null);
      });
    return () => {
      active = false;
    };
  }, [value.avatarIndex]);
  const column = value.avatarIndex % 3;
  const row = Math.floor(value.avatarIndex / 3);
  const style = {
    backgroundImage: 'url(/avatars/character-templates.jpg)',
    backgroundPosition: `${[8, 51, 94][column]}% ${[0, 48, 100][row]}%`,
  };
  return (
    <span
      className={`user-avatar ${className}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : `${value.nickname}的头像`}
      aria-hidden={decorative || undefined}
    >
      {value.avatarDataUrl && value.avatarDataUrl !== failedUrl ? (
        <img src={value.avatarDataUrl} alt="" onError={() => setFailedUrl(value.avatarDataUrl)} />
      ) : template?.index === value.avatarIndex ? (
        <img className="avatar-cutout" src={template.url} alt="" />
      ) : (
        <span className="avatar-sprite" style={style} title={AVATAR_TEMPLATES[value.avatarIndex]} />
      )}
    </span>
  );
}
