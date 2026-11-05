import React, { useId } from 'react';

// 直接展示用户提供的新图形；通过 viewBox 取图形部分，与原图字标分别排版。
export default function BrandMark({ className = '', decorative = false, ink }) {
  const id = useId().replaceAll(':', '');
  return (
    <svg
      className={`brand-mark-image ${className}`}
      viewBox="220 45 770 710"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : '臭脑子'}
      aria-hidden={decorative || undefined}
    >
      {ink ? (
        <>
          <defs>
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
          </defs>
          <rect x="220" y="45" width="770" height="710" fill={ink} mask={`url(#mark-mask-${id})`} />
        </>
      ) : (
        <image href="/brand/coral-logo-reference.png" x="0" y="0" width="1254" height="1254" />
      )}
    </svg>
  );
}
