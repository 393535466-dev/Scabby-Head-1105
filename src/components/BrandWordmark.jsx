import React, { useId } from 'react';

// 使用用户给定图片中的原始手写字形，不用系统字体近似。
// 从浅底中取得字形透明度后，仅改变填色：臭脑为黑色，子为品牌橙色。
export default function BrandWordmark({ english = false, decorative = false, ink }) {
  const uid = useId().replaceAll(':', '');
  const filterId = `wordmark-ink-${uid}`;
  const maskId = `wordmark-mask-${uid}`;
  const [x, y, width, height] = english ? [300, 1065, 666, 80] : [292, 797, 680, 234];
  return (
    <svg
      className={`brand-wordmark ${english ? 'is-english' : ''}`}
      viewBox={`${x} ${y} ${width} ${height}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : english ? 'BRAIN FART' : '臭脑子'}
      aria-hidden={decorative || undefined}
    >
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 -2 0 1.8" />
        </filter>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={x}
          y={y}
          width={width}
          height={height}
          style={{ maskType: 'alpha' }}
        >
          <image
            href="/brand/coral-logo-reference.png"
            x="0"
            y="0"
            width="1254"
            height="1254"
            filter={`url(#${filterId})`}
          />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        {english ? (
          <rect x={x} y={y} width={width} height={height} fill={ink || '#ff7658'} />
        ) : (
          <>
            <rect x={x} y={y} width="463" height={height} fill={ink || '#24242d'} />
            <rect x="755" y={y} width="217" height={height} fill={ink || '#ff7658'} />
          </>
        )}
      </g>
    </svg>
  );
}
