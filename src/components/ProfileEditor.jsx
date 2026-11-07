import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { normalizeProfile, AVATAR_TEMPLATES } from '../lib/profile.js';
import { fileToCompressedDataUrl, loadImage } from '../lib/utils.js';
import Avatar from './Avatar.jsx';
import AvatarCreator from './AvatarCreator.jsx';
import Sheet from './Sheet.jsx';
import Icon from './Icons.jsx';

export default function ProfileEditor({ onClose, onSaved, creating = false }) {
  const { settings, updateSettings, showToast } = useStore();
  const [profile, setProfile] = useState(() => normalizeProfile(settings.profile));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);
  const uploadVersion = useRef(0);
  useEffect(() => () => { uploadVersion.current++; }, []);
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setError('请选择 10 MB 以内的单人照片。');
      return;
    }
    setBusy(true);
    setError('');
    const version = ++uploadVersion.current;
    try {
      const photoDataUrl = await fileToCompressedDataUrl(file, 1024, 0.85);
      const image = await loadImage(photoDataUrl);
      if (image.naturalWidth < 128 || image.naturalHeight < 128) throw new Error('照片有点小，换一张更清晰的单人照吧。');
      if (photoDataUrl.length > 3 * 1024 * 1024 || !/^data:image\/(jpeg|png|webp);base64,/.test(photoDataUrl)) throw new Error('这张照片暂时读不出来，请换成 JPG、PNG 或 WebP。');
      if (version === uploadVersion.current) setPhoto({ url: photoDataUrl, version });
    } catch (err) {
      if (version === uploadVersion.current) setError(err.message || '这张图片读不出来，换一张试试。');
    } finally {
      if (version === uploadVersion.current) setBusy(false);
    }
  };
  const save = (event) => {
    event.preventDefault();
    if (!profile.nickname.trim()) {
      setError('给自己起个昵称吧。');
      return;
    }
    const next = { ...normalizeProfile(profile), created: true };
    try {
      window.localStorage.setItem('chounaozi.profile.v1', JSON.stringify(next));
    } catch {
      setError('头像和昵称没能存到本机，请换小一点的图片后重试。');
      return;
    }
    updateSettings({ profile: next });
    showToast(creating ? '你的臭脑子，准备好了' : '头像和昵称已更新');
    onSaved();
  };
  return (
    <Sheet
      title={photo ? '生成我的 Q 版头像' : creating ? '创建你的臭脑子' : '头像与昵称'}
      onClose={onClose}
      className="profile-sheet"
    >
      <input ref={fileRef} type="file" aria-label="上传单人照片" accept="image/*" hidden onChange={upload} />
      {photo ? <AvatarCreator
        key={photo.version}
        photo={photo.url}
        reading={busy}
        uploadError={error}
        onChangePhoto={() => fileRef.current?.click()}
        onCancel={() => { uploadVersion.current++; setBusy(false); setPhoto(null); setError(''); }}
        onUse={(avatarDataUrl) => {
          setProfile((prev) => ({ ...prev, avatarDataUrl, avatarStyle: 'chounaozi-3d-v1' }));
          setPhoto(null); setError('');
        }}
      /> : <form className="profile-form" onSubmit={save}>
        <div className="profile-preview">
          <Avatar profile={profile} />
          <button
            type="button"
            className="link-btn"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="sparkles" size={17} />
            {busy ? '读取中…' : '上传照片，生成 Q 版头像'}
          </button>
          {profile.avatarStyle && <span className="profile-avatar-label">你的专属 Q 版头像{profile.avatarDataUrl !== settings.profile?.avatarDataUrl ? ' · 保存后生效' : ''}</span>}
        </div>
        <label className="profile-name-field">
          你的昵称
          <input
            className="text-input"
            aria-label="你的昵称"
            value={profile.nickname}
            maxLength={16}
            onChange={(event) => {
              setProfile((prev) => ({ ...prev, nickname: event.target.value }));
              setError('');
            }}
            placeholder="想让我们怎么称呼你？"
          />
        </label>
        <div className="profile-template-heading">
          <h3>或选一个现成的脑袋</h3>
          <span>点选即可使用</span>
        </div>
        <div className="avatar-options" role="group" aria-label="头像模板">
          {AVATAR_TEMPLATES.map((name, index) => (
            <button
              type="button"
              key={name}
              className={!profile.avatarDataUrl && profile.avatarIndex === index ? 'chosen' : ''}
              aria-label={name}
              aria-pressed={!profile.avatarDataUrl && profile.avatarIndex === index}
              disabled={busy}
              onClick={() =>
                setProfile((prev) => ({ ...prev, avatarIndex: index, avatarDataUrl: '', avatarStyle: '' }))
              }
            >
              <Avatar profile={{ nickname: name, avatarIndex: index }} decorative />
            </button>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn primary full" disabled={busy}>
          {creating ? '准备好了，出发' : '保存头像和昵称'} <Icon name="arrowRight" size={16} />
        </button>
      </form>}
    </Sheet>
  );
}
