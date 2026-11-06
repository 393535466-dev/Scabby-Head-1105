import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { selectedOutput } from '../lib/records.js';
import { createImage, imageExtension, imageServiceStatus, prepareGeneratedImage } from '../lib/images.js';
import { imageStyle } from '../../shared/imageStyles.js';
import { todayKey } from '../lib/time.js';
import { downloadDataUrl } from '../lib/utils.js';
import TonePicker from './TonePicker.jsx';
import Icon from './Icons.jsx';

export default function CoverEditor({ record, tone, direction, onBack, onDone }) {
  const { updateRecord, setPosterOfDay, showToast } = useStore();
  const output = selectedOutput(record);
  const existing = record.cover?.type === 'generated-image' ? record.cover : null;
  const sameSource = existing?.sourceOutputId === (record.selectedOutputId || '');
  const [imageTone, setImageTone] = useState(imageStyle((sameSource ? existing?.tone : output?.tone) || tone)?.id || '温和');
  const [text, setText] = useState((sameSource && existing?.sourceText) || output?.text || record.caption || record.text || '');
  const [instruction, setInstruction] = useState((sameSource && existing?.instruction) || '');
  const [usePhoto, setUsePhoto] = useState(existing?.usedPhoto ?? Boolean(record.photoDataUrl));
  const [image, setImage] = useState(existing);
  const [service, setService] = useState({ loading: true, configured: false, failed: false });
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [checkVersion, setCheckVersion] = useState(0);
  const requestRef = useRef(null);
  const style = imageStyle(imageTone) || imageStyle();
  const imageDirection = output?.direction || direction || '正经好用';
  const current = Boolean(image?.imageDataUrl && image.tone === imageTone && image.direction === imageDirection && image.sourceText === text.trim() && (image.instruction || '') === instruction.trim() && Boolean(image.usedPhoto) === Boolean(usePhoto && record.photoDataUrl));

  useEffect(() => {
    const controller = new AbortController();
    setService({ loading: true, configured: false, failed: false });
    imageServiceStatus(controller.signal)
      .then((value) => { if (!controller.signal.aborted) setService({ loading: false, configured: value.configured, failed: false }); })
      .catch(() => { if (!controller.signal.aborted) setService({ loading: false, configured: false, failed: true }); });
    return () => controller.abort();
  }, [checkVersion]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  const generate = async () => {
    if (busy) return;
    setError('');
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    try {
      const result = await createImage({ text: text.trim(), originalText: record.text || '', instruction: instruction.trim(), tone: imageTone, direction: imageDirection, photoDataUrl: usePhoto ? record.photoDataUrl || '' : '' }, controller.signal);
      const imageDataUrl = await prepareGeneratedImage(result.data.imageDataUrl);
      if (controller.signal.aborted) return;
      setImage({ ...result.data, imageDataUrl, source: result.source, model: result.model, sourceText: text.trim(), instruction: instruction.trim(), usedPhoto: Boolean(usePhoto && record.photoDataUrl), sourceOutputId: record.selectedOutputId || '' });
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message || '图片暂时没有生成成功，请重试。');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  const save = () => {
    if (!current || busy) return;
    const cover = { ...image, type: 'generated-image', title: image.sourceText.slice(0, 120), dateKey: todayKey() };
    updateRecord(record.id, { cover });
    // Keep the large image in IndexedDB only, rather than duplicating it in settings.
    setPosterOfDay(cover.dateKey, { recordId: record.id, title: cover.title, tone: cover.tone, source: cover.source, createdAt: cover.createdAt });
    showToast('图片已收进灵感库');
    onDone();
  };

  return (
    <div className="image-studio">
      <button type="button" className="text-back" onClick={onBack}>
        <Icon name="chevronLeft" size={17} />回到记录
      </button>
      <div className="image-studio-heading">
        <h3>生成图片</h3>
        <span>{style.name}</span>
      </div>
      <section className="image-style-section">
        <h4>画面风格</h4>
        <TonePicker value={imageTone} onChange={setImageTone} disabled={busy} ariaLabel="选择画面风格" hint={style.hint} />
      </section>
      {!service.loading && !service.configured && (
        <div className="image-service-note" role="status">
          <span>{service.failed ? '图片服务暂时连接不上。' : '图片生成功能暂未开通。'}</span>
          <button type="button" className="link-btn" onClick={() => setCheckVersion((value) => value + 1)}>重新检查</button>
        </div>
      )}
      <div className={'generated-image-stage' + (!image?.imageDataUrl ? ' is-empty' : '') + (busy ? ' is-generating' : '')} aria-busy={busy}>
        {image?.imageDataUrl ? (
          <img src={image.imageDataUrl} alt={image.tone + '风格生成的图片'} />
        ) : (
          <div className="generated-image-empty">
            <Icon name="image" size={42} />
            <strong>把这句话，画出来。</strong>
            <span>选好风格，再点「生成图片」</span>
          </div>
        )}
        {busy && <div className="image-generation-progress" role="status"><Icon name="refresh" size={24} className="spinning" /><span>正在生成{imageTone}风格图片 · {elapsed} 秒</span></div>}
      </div>
      {image && !current && <p className="image-change-hint">设置已更新，重新生成后再保存。</p>}
      <label className="field">
        根据这句话生成
        <textarea className="text-input" aria-label="图片创作内容" value={text} onChange={(event) => setText(event.target.value)} maxLength={1200} rows={3} disabled={busy} placeholder="想画什么，也可以直接写在这里。" />
      </label>
      <label className="field">
        画面补充，可留空
        <textarea className="text-input" aria-label="画面补充" value={instruction} onChange={(event) => setInstruction(event.target.value)} maxLength={300} rows={2} disabled={busy} placeholder="比如：让猫当主角，画得夸张一点。" />
      </label>
      {record.photoDataUrl && (
        <label className="image-photo-reference">
          <input type="checkbox" checked={usePhoto} disabled={busy} onChange={(event) => setUsePhoto(event.target.checked)} />
          <img src={record.photoDataUrl} alt="本次可参考的原照片" />
          <span>参考原照片的主体和场景</span>
        </label>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="button" className="btn primary full image-generate-button" disabled={busy || service.loading || !service.configured || (!text.trim() && !(usePhoto && record.photoDataUrl))} onClick={generate}>
        <Icon name={busy ? 'refresh' : 'sparkles'} className={busy ? 'spinning' : ''} size={18} />
        {busy ? '正在生成图片…' : service.loading ? '正在连接图片服务…' : image ? '重新生成图片' : '生成图片'}
      </button>
      {image?.imageDataUrl && (
        <div className="image-studio-actions">
          <button type="button" className="btn primary" disabled={!current || busy} onClick={save}><Icon name="check" size={17} />收进图片库</button>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => downloadDataUrl(image.imageDataUrl, '臭脑子-' + image.tone + '-' + todayKey() + '.' + imageExtension(image.imageDataUrl))}><Icon name="download" size={17} />保存图片</button>
        </div>
      )}
    </div>
  );
}
