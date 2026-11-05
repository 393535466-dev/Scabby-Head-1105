import { useEffect, useRef, useState } from 'react';

export function voiceText(base, results, limit = 1000) {
  const final = Array.from(results)
    .filter((result) => result.isFinal)
    .map((result) => result[0]?.transcript || '')
    .join('');
  const interim = Array.from(results)
    .filter((result) => !result.isFinal)
    .map((result) => result[0]?.transcript || '')
    .join('');
  return {
    text: `${base}${base && final ? '\n' : ''}${final}`.slice(0, limit),
    interim,
    hasFinal: Boolean(final),
  };
}

const MESSAGES = {
  'not-allowed': '麦克风没有获准使用。请在浏览器站点设置中允许麦克风后重试。',
  'service-not-allowed': '浏览器没有开放语音识别服务，可以换用支持的浏览器。',
  'audio-capture': '没有找到可用的麦克风，请检查设备。',
  'no-speech': '刚才没有听清，点语音输入再说一次。',
  network: '语音识别服务连接失败，请检查网络后重试。',
};

export default function useVoiceInput({ text, onText, onRecognized }) {
  const Recognition =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const [phase, setPhase] = useState('idle');
  const [interim, setInterim] = useState('');
  const [message, setMessage] = useState('');
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const callbacks = useRef({ onText, onRecognized });
  callbacks.current = { onText, onRecognized };

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onstart = null;
        try {
          recognition.abort();
        } catch {
          /* 已结束 */
        }
      }
    },
    [],
  );

  const stop = () => {
    if (!recognitionRef.current) return;
    setPhase('stopping');
    try {
      recognitionRef.current.stop();
    } catch {
      recognitionRef.current = null;
      clearTimeout(timerRef.current);
      setPhase('idle');
    }
  };

  const start = () => {
    if (!Recognition || recognitionRef.current) return;
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    const base = text;
    let hadResult = false;
    let hadError = false;
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    setMessage('');
    setPhase('starting');
    recognition.onstart = () => {
      setPhase('listening');
      timerRef.current = setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          /* 已结束 */
        }
      }, 60000);
    };
    recognition.onresult = (event) => {
      const result = voiceText(base, event.results);
      callbacks.current.onText(result.text);
      setInterim(result.interim);
      if (result.hasFinal) {
        hadResult = true;
        callbacks.current.onRecognized?.();
      }
      if (result.text.length >= 1000) recognition.stop();
    };
    recognition.onerror = (event) => {
      hadError = true;
      setMessage(MESSAGES[event.error] || '语音输入中断了，已识别的文字仍然保留。');
    };
    recognition.onend = () => {
      clearTimeout(timerRef.current);
      recognitionRef.current = null;
      setPhase('idle');
      setInterim('');
      if (!hadResult && !hadError) setMessage('没有识别到文字，可以再说一次。');
    };
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setPhase('idle');
      setMessage('语音暂时无法启动，请稍后重试。');
    }
  };
  return {
    supported: Boolean(Recognition),
    active: phase !== 'idle',
    phase,
    interim,
    message,
    start,
    stop,
  };
}
