import React from 'react';

// 这些装饰与三个操作泡泡分开，始终不拦截点击，也不进入朗读顺序。
export default function ThoughtEffects({ type }) {
  if (type === 'idle') return null;
  return (
    <div className={`thought-effect effect-${type}`} key={type} aria-hidden="true">
      {type === 'thought' ? <svg className="thought-cloud" viewBox="0 0 140 100">
        <circle className="thought-part thought-dot-one" cx="15" cy="91" r="3" />
        <circle className="thought-part thought-dot-two" cx="25" cy="79" r="5" />
        <circle className="thought-part thought-dot-three" cx="41" cy="65" r="8" />
        <g className="thought-part thought-cloud-body">
          <path d="M32 48C17 43 18 26 29 21C27 7 43 1 55 8C63-4 81-1 88 9C102 0 118 8 117 20C134 22 141 40 128 49C132 65 111 74 100 65C89 79 71 77 63 65C47 72 29 65 32 48Z" />
          <g className="thought-cloud-dots"><circle cx="64" cy="37" r="3" /><circle cx="80" cy="37" r="3" /><circle cx="96" cy="37" r="3" /></g>
        </g>
      </svg> : <div className="thought-marks">
        {[0, 1, 2].map((n) => <span key={n} className={`thought-ray thought-ray-${n}`} style={{ '--mark-delay': `${n * .42}s` }}>
          <span className="thought-mark">{type === 'surprise' ? '!' : '?'}</span>
        </span>)}
      </div>}
    </div>
  );
}
