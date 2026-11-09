import React from 'react';

// 保留原图的两只眼睛。裁切框只取眼部，坐标对应 1254px 品牌原图。
export const BRAND_EYES = [
  { x: 465, y: 349, width: 62, height: 112, cx: 496, cy: 404 },
  { x: 560, y: 353, width: 64, height: 112, cx: 591.5, cy: 408 },
];

// 15 秒一轮。眨眼短、表情稍作停留，左右看之间和循环衔接处都回到原始眼睛。
const DURATION = 15000;
const EXPRESSIONS = [
  { shape: 'line', start: 1100, close: 90, hold: 65, open: 135 },
  { shape: 'arc', start: 5200, close: 180, hold: 650, open: 230 },
  { shape: 'squeeze', start: 7400, close: 120, hold: 500, open: 180 },
  { shape: 'line', start: 9300, close: 90, hold: 55, open: 135 },
  { shape: 'cross', start: 10700, close: 120, hold: 420, open: 180 },
  { shape: 'line', start: 12800, close: 180, hold: 650, open: 270 },
];
const expressionTrack = (events, resting, active) => [
  [0, resting],
  ...events.flatMap(({ start, close, hold, open }) => [
    [start, resting], [start + close, active],
    [start + close + hold, active], [start + close + hold + open, resting],
  ]),
  [DURATION, resting],
];
const OPENING = expressionTrack(EXPRESSIONS, 1, .1);
const ORIGINAL_OPACITY = expressionTrack(EXPRESSIONS, 1, 0);
const GAZE = [
  [0, 0], [1900, 0], [2230, -11], [2830, -11], [3230, 0],
  [3650, 0], [3980, 11], [4580, 11], [4900, 0], [DURATION, 0],
];
const SHAPES = ['line', 'arc', 'squeeze', 'cross'].map((name) => ({
  name,
  opacity: expressionTrack(EXPRESSIONS.filter(({ shape }) => shape === name), 0, 1),
}));
// 原始胶囊眼宽约 50px。表情用 28px 圆头粗线、76px 外宽，
// 在 170px 宽的 Logo 中仍有约 6px 的线重，避免切换后变成细小的符号。
const EXPRESSION_STROKE = 28;
const shapePath = (name, index) => ({
  line: 'M-24 0H24',
  arc: 'M-24 -18C-24 22 24 22 24 -18',
  cross: 'M-24 -24L24 24M24 -24L-24 24',
  squeeze: index === 0 ? 'M-24 -22L24 0L-24 22' : 'M24 -22L-24 0L24 22',
})[name];
const timing = (track) => ({
  dur: `${DURATION}ms`,
  repeatCount: 'indefinite',
  calcMode: 'spline',
  keyTimes: track.map(([time]) => time / DURATION).join(';'),
  keySplines: track.slice(1).map(() => '.4 0 .2 1').join(';'),
});

export default function BrandEyes({ artId, id, ink = '#ff7658' }) {
  return <g className="brand-eyes" aria-hidden="true">
    <defs>
      {BRAND_EYES.map((eye, index) => <clipPath key={index} id={`${id}-eye-${index}`} clipPathUnits="userSpaceOnUse">
        <rect x={eye.x} y={eye.y} width={eye.width} height={eye.height} />
      </clipPath>)}
    </defs>
    <g className="brand-eye-gaze">
      <animateTransform attributeName="transform" type="translate" values={GAZE.map(([, x]) => `${x} 0`).join(';')} {...timing(GAZE)} />
      {BRAND_EYES.map((eye, index) => <g key={index} transform={`translate(${eye.cx} ${eye.cy})`}>
        <g className="brand-eye-opening">
          <animateTransform attributeName="transform" type="scale" values={OPENING.map(([, scale]) => `1 ${scale}`).join(';')} {...timing(OPENING)} />
          <animate attributeName="opacity" values={ORIGINAL_OPACITY.map(([, opacity]) => opacity).join(';')} {...timing(ORIGINAL_OPACITY)} />
          <g transform={`translate(${-eye.cx} ${-eye.cy})`}>
            <g clipPath={`url(#${id}-eye-${index})`}><use href={`#${artId}`} /></g>
          </g>
        </g>
        {SHAPES.map(({ name, opacity }) => <g key={name} className="brand-eye-expression" data-eye-shape={name} opacity="0">
          <animate attributeName="opacity" values={opacity.map(([, value]) => value).join(';')} {...timing(opacity)} />
          <path d={shapePath(name, index)} fill="none" stroke={ink} strokeWidth={EXPRESSION_STROKE} strokeLinecap="round" strokeLinejoin="round" />
        </g>)}
      </g>)}
    </g>
  </g>;
}
