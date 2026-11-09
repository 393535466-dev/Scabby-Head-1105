import React, { useId } from 'react';
import Avatar from '../Avatar.jsx';
import { normalizeProfile } from '../../lib/profile.js';
import rigs from './avatar-eye-rigs.json';

const clamp = (value) => Math.max(-1, Math.min(1, Number(value) || 0));

// 每个模板独立的眼白轮廓、瞳孔比例和颜色，坐标对应 avatarTemplate 的 256px 裁切。
// 矢量眼白覆盖原图中固定的瞳孔，移动图层被眼部轮廓裁切，保留脸、发型与耳朵原图。
export default function AnimatedAvatar({ profile, gaze = [0, 0], still = false }) {
  const id = useId().replaceAll(':', '');
  const value = normalizeProfile(profile);
  const rig = rigs[value.avatarIndex];
  const x = still ? 0 : clamp(gaze[0]);
  const y = still ? 0 : clamp(gaze[1]);
  return (
    <span className={`animated-avatar ${still ? 'is-still' : ''}`} style={{ '--head-angle': `${x * 1.8}deg` }}>
      <Avatar profile={value} />
      {!value.avatarDataUrl && <svg className="avatar-eye-layers" viewBox="0 0 256 256" aria-hidden="true" data-eye-rig={value.avatarIndex}>
        <defs>
          <radialGradient id={`${id}-white`} cx="44%" cy="35%" r="75%">
            <stop offset="0" stopColor="#ffffff" /><stop offset=".65" stopColor="#f7fafc" /><stop offset="1" stopColor="#c9d6e2" />
          </radialGradient>
          <radialGradient id={`${id}-iris`} cx="35%" cy="25%" r="90%">
            <stop offset="0" stopColor={rig.irisLight} /><stop offset=".8" stopColor={rig.irisDark} />
          </radialGradient>
          {rig.eyes.map((eye, i) => <clipPath key={i} id={`${id}-eye-${i}`}><path d={eye.path} /></clipPath>)}
        </defs>
        {rig.eyes.map((eye, i) => <g key={i} className="avatar-eye">
          <path d={eye.path} fill={`url(#${id}-white)`} stroke={`url(#${id}-white)`} strokeWidth="1.2" strokeLinejoin="round" />
          <g clipPath={`url(#${id}-eye-${i})`}>
            <g className="avatar-pupil" style={{ transform: `translate(${x * eye.travelX}px, ${y * eye.travelY}px)` }}>
              <ellipse cx={eye.cx} cy={eye.cy} rx={eye.rx} ry={eye.ry} fill={`url(#${id}-iris)`} />
              <ellipse cx={eye.cx - eye.rx * .26} cy={eye.cy - eye.ry * .57} rx={eye.rx * .16} ry={eye.ry * .12} fill="white" opacity=".48" />
            </g>
          </g>
        </g>)}
      </svg>}
    </span>
  );
}
