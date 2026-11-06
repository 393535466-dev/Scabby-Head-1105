import React from 'react';

export default function HandDrawnArrow({ className = '' }) {
  return (
    <svg className={`hand-drawn-arrow ${className}`} viewBox="0 0 72 56" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 48c4-12 11-22 21-28 8-5 18-7 29-6l-3 6c-10-1-19 1-26 5-8 5-14 13-18 24l-3-1Z"
      />
      <path
        fill="currentColor"
        d="m40 4 7 2c6 4 11 9 19 14l-1 4c-11 1-20 5-29 10l-3-4c6-5 12-8 20-10-5-3-10-7-15-11l2-5Z"
      />
      <path d="M10 42c8-17 22-24 42-25M42 8l17 12-19 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
