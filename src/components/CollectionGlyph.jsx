import React from 'react';

// 使用统一的圆角、粗实剪影，与用户给的符号参考保持一致。
export default function CollectionGlyph({ name }) {
  return (
    <svg viewBox="0 0 80 80" fill="currentColor" aria-hidden="true" focusable="false">
      {name === 'ideas' && (
        <path d="M30 21C28 12 32 7 39 7C46 7 50 13 48 22C57 16 64 17 67 23C71 30 67 37 57 40C67 44 71 51 67 58C63 64 56 65 48 58C51 68 47 74 40 74C32 74 28 68 31 58C22 65 15 64 11 58C7 51 11 44 22 40C12 37 8 30 12 23C16 17 23 16 30 21Z" />
      )}
      {name === 'rewrites' && (
        <>
          <path d="M10 12H28C32 12 34 15 34 19V38C34 52 27 63 14 69L7 58C16 54 20 49 21 41H10C6 41 4 38 4 34V19C4 15 6 12 10 12Z" />
          <path d="M48 12H66C70 12 72 15 72 19V38C72 52 65 63 52 69L45 58C54 54 58 49 59 41H48C44 41 42 38 42 34V19C42 15 44 12 48 12Z" />
        </>
      )}
      {name === 'covers' && (
        <>
          <rect x="8" y="16" width="53" height="57" rx="12" />
          <path d="M29 7H61C68 7 73 12 73 19V52C73 58 69 63 64 65V26C64 19 60 13 53 13H19C21 9 24 7 29 7Z" />
          <circle cx="24" cy="33" r="6" fill="var(--tile-color)" />
          <path d="M17 60L29 43L39 54L47 42L56 60Z" fill="var(--tile-color)" />
        </>
      )}
      {name === 'pending' && (
        <path d="M21 9H61C68 9 72 13 72 20V60C72 66 68 70 62 70C56 70 52 66 52 60V42L23 71C19 75 13 75 9 71C5 67 5 61 9 57L38 28H21C15 28 11 24 11 18C11 13 15 9 21 9Z" />
      )}
    </svg>
  );
}
