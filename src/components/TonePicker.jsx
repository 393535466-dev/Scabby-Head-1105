import React from 'react';
import { TONES, TONE_HINTS, normalizeTone } from '../lib/constants.js';

export default function TonePicker({ value, onChange, disabled = false, ariaLabel = '选择加工语气', hint }) {
  return (
    <div className="tone-picker">
      <div className="tone-options" role="group" aria-label={ariaLabel}>
        {TONES.map((tone) => (
          <button
            type="button"
            key={tone}
            disabled={disabled}
            aria-pressed={normalizeTone(value) === tone}
            className={normalizeTone(value) === tone ? 'active' : ''}
            onClick={() => onChange(tone)}
          >
            {tone}
          </button>
        ))}
      </div>
      <p className="tone-hint">{hint || TONE_HINTS[normalizeTone(value)]}</p>
    </div>
  );
}
