import React, { useState } from 'react';
import AnimatedAvatar from '../components/record-home/AnimatedAvatar.jsx';
import useAvatarMotion from '../components/record-home/useAvatarMotion.js';
import { AVATAR_TEMPLATES } from '../lib/profile.js';

const DIRECTIONS = [
  ['auto', '自动转动', [0, 0]], ['left', '看左边', [-1, 0]],
  ['front', '看前方', [0, 0]], ['right', '看右边', [1, 0]],
  ['up', '抬眼看看', [0, -1]], ['down', '看下面', [0, 1]],
];

export default function AvatarMotionReview() {
  const [direction, setDirection] = useState('auto');
  const motion = useAvatarMotion();
  const gaze = direction === 'auto' ? motion.gaze : DIRECTIONS.find(([id]) => id === direction)[2];
  return <main className="avatar-review"><div className="avatar-review-inner">
    <a href="/record-home-preview.html">← 回到记录首页预览</a>
    <h1>九个脑袋，都有自己的小眼神。</h1>
    <p>选一个方向，看看每个头像的眼睛。这里只展示默认头像，不更改你的个人设置。</p>
    <div className="avatar-review-controls" role="group" aria-label="眼睛方向">
      {DIRECTIONS.map(([id, label]) => <button key={id} type="button" aria-pressed={direction === id} onClick={() => setDirection(id)}>{label}</button>)}
    </div>
    <div className="avatar-review-grid">{AVATAR_TEMPLATES.map((name, index) => <section className="avatar-review-item" key={name}>
      <AnimatedAvatar profile={{ nickname: name, avatarIndex: index }} gaze={gaze} still={motion.reduced} />
      <h2>{name}</h2>
    </section>)}</div>
  </div></main>;
}
