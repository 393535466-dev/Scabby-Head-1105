import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { normalizeProfile, AVATAR_TEMPLATES } from '../lib/profile.js';
import { fileToCompressedDataUrl, loadImage } from '../lib/utils.js';
import Avatar from './Avatar.jsx';
import Sheet from './Sheet.jsx';
import Icon from './Icons.jsx';

export default function ProfileEditor({ onClose, onSaved, creating = false }) {
  const { settings, updateSettings, showToast } = useStore();
  const [profile, setProfile] = useState(() => normalizeProfile(settings.profile));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setError('请选择 10 MB 以内的头像图片。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const avatarDataUrl = await fileToCompressedDataUrl(file, 360, 0.82);
      await loadImage(avatarDataUrl);
      setProfile((prev) => ({ ...prev, avatarDataUrl }));
    } catch {
      setError('这张图片读不出来，换一张试试。');
    } finally {
      setBusy(false);
      event.target.value = '';
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
      title={creating ? '创建你的臭脑子' : '头像与昵称'}
      onClose={onClose}
      className="profile-sheet"
    >
      <form className="profile-form" onSubmit={save}>
        <div className="profile-preview">
          <Avatar profile={profile} />
          <button
            type="button"
            className="link-btn"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="image" size={15} />
            {busy ? '读取中…' : '上传自己的头像'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
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
          <h3>选一个脑袋</h3>
          <span>也可以用自己的照片</span>
        </div>
        <div className="avatar-options" role="group" aria-label="头像模板">
          {AVATAR_TEMPLATES.map((name, index) => (
            <button
              type="button"
              key={name}
              className={!profile.avatarDataUrl && profile.avatarIndex === index ? 'chosen' : ''}
              aria-label={name}
              aria-pressed={!profile.avatarDataUrl && profile.avatarIndex === index}
              onClick={() =>
                setProfile((prev) => ({ ...prev, avatarIndex: index, avatarDataUrl: '' }))
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
      </form>
    </Sheet>
  );
}
