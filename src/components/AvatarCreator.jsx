import React, { useEffect, useRef, useState } from 'react';
import { createImage, imageServiceStatus } from '../lib/images.js';
import { prepareGeneratedAvatar } from '../lib/generatedAvatar.js';
import Avatar from './Avatar.jsx';
import Icon from './Icons.jsx';

export default function AvatarCreator({ photo, onUse, onCancel, onChangePhoto, reading, uploadError }) {
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [service, setService] = useState({ loading: true, configured: false });
  const [checkVersion, setCheckVersion] = useState(0);
  const request = useRef(null);
  const locked = busy || reading;

  useEffect(() => {
    const controller = new AbortController();
    setService({ loading: true, configured: false });
    imageServiceStatus(controller.signal)
      .then((value) => { if (!controller.signal.aborted) setService({ loading: false, configured: value.configured }); })
      .catch(() => { if (!controller.signal.aborted) setService({ loading: false, configured: false }); });
    return () => controller.abort();
  }, [checkVersion]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  const generate = async () => {
    if (locked || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError(''); setAttempted(true);
    try {
      const response = await createImage({ purpose: 'avatar', photoDataUrl: photo }, controller.signal);
      if (controller.signal.aborted) return;
      const avatar = await prepareGeneratedAvatar(response.data.imageDataUrl);
      if (!controller.signal.aborted) setResult(avatar);
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message || '这次没画好，换一版试试。');
    } finally {
      if (!controller.signal.aborted) { request.current = null; setBusy(false); }
    }
  };

  return (
    <div className="avatar-creator">
      <button type="button" className="text-back" onClick={onCancel}><Icon name="chevronLeft" size={17} />返回头像选择</button>
      <div className="avatar-creator-intro">
        <span className="avatar-style-label">臭脑子同款 · 3D Q 版</span>
        <h3>把你，变成一个小脑袋。</h3>
        <p>保留你的发型和特点，换上圆眼睛与玩具质感。</p>
      </div>
      <div className="avatar-comparison">
        <figure>
          <div className="avatar-source"><img src={photo} alt="本次用来生成头像的照片" /></div>
          <figcaption>你的照片</figcaption>
        </figure>
        <Icon className="avatar-transform-arrow" name="arrowRight" size={22} />
        <figure>
          <div className="avatar-result" aria-busy={busy}>
            {result ? <img src={result} alt="生成的个人 Q 版头像预览" /> : <Icon name="sparkles" size={40} />}
            {busy && <div className="avatar-generating" role="status"><Icon className="spinning" name="refresh" size={25} /><span>捏脑袋中 · {elapsed} 秒</span></div>}
          </div>
          <figcaption>{result ? '你的 Q 版' : '等一个小分身'}</figcaption>
        </figure>
      </div>
      {!result && <div className="avatar-style-preview" aria-label="头像风格参考"><span>会长成这种画风</span><div>{[0, 2, 5].map((index) => <Avatar key={index} profile={{ avatarIndex: index }} decorative />)}</div></div>}
      {!service.loading && !service.configured && <div className="image-service-note" role="status"><span>头像生成暂时连接不上。</span><button type="button" className="link-btn" onClick={() => setCheckVersion((v) => v + 1)}>重新检查</button></div>}
      {(error || uploadError) && <p className="form-error" role="alert">{uploadError || error}{result && ' 上一版还在，可以继续使用。'}</p>}
      <div className="avatar-creator-actions">
        {result && <button type="button" className="btn primary full" disabled={locked} onClick={() => onUse(result)}><Icon name="check" size={18} />用这个头像</button>}
        <button type="button" className={'btn full ' + (result ? 'ghost' : 'primary')} disabled={locked || service.loading || !service.configured} onClick={generate}>
          <Icon name={busy || attempted ? 'refresh' : 'sparkles'} size={18} className={busy ? 'spinning' : ''} />
          {busy ? '正在生成…' : service.loading ? '正在连接…' : attempted ? '换一版' : '生成我的 Q 版头像'}
        </button>
        <button type="button" className="link-btn" disabled={locked} onClick={onChangePhoto}><Icon name="image" size={16} />{reading ? '读取中…' : '换张照片'}</button>
      </div>
      <p className="avatar-photo-note">建议用清晰的单人正面照。点击生成后，照片会发送给 AI 图片服务；本机只保存你选用的头像。</p>
    </div>
  );
}
