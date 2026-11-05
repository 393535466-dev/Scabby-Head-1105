import React from 'react';
import { TONES, TONE_HINTS, normalizeTone } from '../lib/constants.js';

export default function TonePicker({ value, onChange }) {
  return (
    <div className="tone-picker">
      <div className="tone-options" role="group" aria-label="选择加工语气">
        {TONES.map((tone) => (
          <button
            type="button"
            key={tone}
            aria-pressed={normalizeTone(value) === tone}
            className={normalizeTone(value) === tone ? 'active' : ''}
            onClick={() => onChange(tone)}
          >
            {tone}
          </button>
        ))}
      </div>
      <p className="tone-hint">{TONE_HINTS[normalizeTone(value)]}</p>
    </div>
  );
}
