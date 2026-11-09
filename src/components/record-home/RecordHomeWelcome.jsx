import React, { useEffect, useRef, useState } from 'react';
import AnimatedAvatar from './AnimatedAvatar.jsx';
import ThoughtEffects from './ThoughtEffects.jsx';
import useAvatarMotion from './useAvatarMotion.js';
import Icon from '../Icons.jsx';
import { useStore } from '../../lib/store.jsx';
import { normalizeProfile } from '../../lib/profile.js';
import { avatarTemplate } from '../../lib/avatarImage.js';

// 设计预览用文案，用来评估换句子的节奏；不假装调用生成服务。
const LINES = [
  ['脑子偶尔短路，', '也可能是灵感在抄近道。'],
  ['今天也允许自己，', '做个快乐的半成品。'],
  ['脑袋里住了好多想法，', '先放一个出来透透气。'],
  ['生活偶尔没什么头绪，', '但可以有一点好笑。'],
  ['今天的风有点调皮，', '把烦恼吹成了一个脑洞。'],
  ['想到哪儿，就记到哪儿。', '剩下的，交给明天的脑袋。'],
  ['大事还没想明白，', '先把今天的小快乐存起来。'],
  ['脑子说它在加载，', '其实偷偷开了个小差。'],
];

export default function RecordHomeWelcome() {
  const { settings, setComposerOpen, composerOpen, selectedId } = useStore();
  const profile = normalizeProfile(settings.profile);
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  const [line, setLine] = useState(0);
  const [pointerGaze, setPointerGaze] = useState(null);
  const pointerTimer = useRef(null);
  const motion = useAvatarMotion({ ready, replay, paused: composerOpen || Boolean(selectedId) });
  useEffect(() => () => clearTimeout(pointerTimer.current), []);

  useEffect(() => {
    let active = true;
    // 头像素材准备好再开始入场，避免泡泡先出现、头像随后闪入。
    setReady(false);
    const image = new Image();
    const complete = () => { if (active) setReady(true); };
    if (profile.avatarDataUrl) {
      image.onload = complete;
      image.onerror = complete;
      image.src = profile.avatarDataUrl;
    } else {
      avatarTemplate(profile.avatarIndex).then(complete, complete);
    }
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, [profile.avatarIndex, profile.avatarDataUrl]);

  const nextLine = () => setLine((value) => value + 1);
  const followPointer = (event) => {
    if (!motion.running || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    setPointerGaze([(event.clientX - box.left - box.width / 2) / (box.width / 2), (event.clientY - box.top - box.height / 2) / (box.height / 2)]);
    clearTimeout(pointerTimer.current);
    pointerTimer.current = setTimeout(() => setPointerGaze(null), 1600);
  };
  return (
    <section className="record-home-welcome" aria-label="记录首页欢迎页">
      <div className={`welcome-sequence ${ready ? 'is-ready' : ''}`} key={replay}>
        <div className="avatar-stage" onPointerMove={followPointer} onPointerLeave={() => setPointerGaze(null)}>
          <div className="avatar-light" aria-hidden="true" />
          <div className="avatar-arrival">
            <button className="hero-avatar" type="button" aria-label="重播头像和泡泡入场动画" title="点我，再打个招呼" onClick={() => setReplay((value) => value + 1)}>
              <AnimatedAvatar profile={profile} gaze={pointerGaze || motion.gaze} still={!motion.running} />
            </button>
          </div>
          <ThoughtEffects type={motion.type} />
          <div className="bubble-arrival bubble-one">
            <button className="welcome-bubble" type="button" onClick={() => setComposerOpen(true)}>
              <span className="bubble-emoji" aria-hidden="true">😋</span><span>喂点新鲜事</span>
              <span className="bubble-tail" aria-hidden="true" />
            </button>
          </div>
          <div className="bubble-arrival bubble-two">
            <button className="welcome-bubble" type="button" onClick={nextLine}>
              <span className="bubble-emoji" aria-hidden="true">🤔</span><span>换个说法</span>
              <span className="bubble-tail" aria-hidden="true" />
            </button>
          </div>
          <div className="bubble-arrival bubble-three">
            <button className="welcome-bubble" type="button" onClick={() => setComposerOpen(true)}>
              <span className="bubble-emoji" aria-hidden="true">📝</span><span>快来记录一下</span>
              <span className="bubble-tail" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="welcome-message">
          <h2>欢迎来到臭脑子<span className="hello-spark" aria-hidden="true">!</span></h2>
          <div className="welcome-line-slot" aria-live="polite" aria-atomic="true">
            <p className="welcome-line" key={line}>
              {LINES[line % LINES.length].map((text) => <span key={text}>{text}</span>)}
            </p>
          </div>
          <button type="button" className="welcome-refresh" onClick={nextLine}>
            <Icon name="refresh" size={15} /><span>换一句试试</span>
          </button>
        </div>
      </div>
    </section>
  );
}
