import React from 'react';
import BrandMark from './BrandMark.jsx';
import BrandWordmark from './BrandWordmark.jsx';
import HandDrawnArrow from './HandDrawnArrow.jsx';

export default function WelcomeScreen({ onEnter, creating }) {
  return (
    <main className="launch-screen">
      <div className="launch-brand">
        <BrandMark ink="#612a25" animateEyes />
        <h1>
          <BrandWordmark decorative ink="#612a25" />
          <span className="sr-only">臭脑子</span>
        </h1>
        <p>
          <BrandWordmark english decorative ink="#612a25" />
          <span className="sr-only">BRAIN FART</span>
        </p>
      </div>
      <button type="button" className="launch-enter" onClick={onEnter}>
        {creating ? '创建我的臭脑子' : '进入臭脑子'} <HandDrawnArrow />
      </button>
    </main>
  );
}
