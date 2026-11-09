import React, { useEffect, useId, useRef } from 'react';
import BrandEyes, { BRAND_EYES } from './BrandEyes.jsx';

// 直接展示用户提供的新图形；通过 viewBox 取图形部分，与原图字标分别排版。
export default function BrandMark({ className = '', decorative = false, ink, animateEyes = false }) {
  const id = useId().replaceAll(':', '');
  const svgRef = useRef(null);
  const artId = `mark-art-${id}`;
  const bodyMaskId = `mark-body-${id}`;
  useEffect(() => {
    if (!animateEyes) return;
    const svg = svgRef.current;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (media.matches) {
        svg.pauseAnimations();
        svg.setCurrentTime(0);
      } else if (document.hidden) svg.pauseAnimations();
      else svg.unpauseAnimations();
    };
    sync();
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      svg.pauseAnimations();
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [animateEyes]);
  return (
    <svg
      ref={svgRef}
      className={`brand-mark-image ${className}`}
      data-animated-eyes={animateEyes || undefined}
      viewBox="220 45 770 710"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : '臭脑子'}
      aria-hidden={decorative || undefined}
    >
      <defs>
        {ink && <>
          <filter id={`mark-ink-${id}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 -2 0 1.8" />
          </filter>
          <mask
            id={`mark-mask-${id}`}
            maskUnits="userSpaceOnUse"
            x="220"
            y="45"
            width="770"
            height="710"
            style={{ maskType: 'alpha' }}
          >
            <image
              href="/brand/coral-logo-reference.png"
              x="0"
              y="0"
              width="1254"
              height="1254"
              filter={`url(#mark-ink-${id})`}
            />
          </mask>
        </>}
        <g id={artId}>
          {ink ? <rect x="220" y="45" width="770" height="710" fill={ink} mask={`url(#mark-mask-${id})`} />
            : <image href="/brand/coral-logo-reference.png" x="0" y="0" width="1254" height="1254" />}
        </g>
        {animateEyes && <mask id={bodyMaskId} maskUnits="userSpaceOnUse" x="220" y="45" width="770" height="710" style={{ maskType: 'luminance' }}>
          <rect x="220" y="45" width="770" height="710" fill="white" />
          {BRAND_EYES.map((eye, index) => <rect key={index} x={eye.x} y={eye.y} width={eye.width} height={eye.height} fill="black" />)}
        </mask>}
      </defs>
      <use href={`#${artId}`} mask={animateEyes ? `url(#${bodyMaskId})` : undefined} />
      {animateEyes && <BrandEyes artId={artId} id={`mark-${id}`} ink={ink} />}
    </svg>
  );
}
