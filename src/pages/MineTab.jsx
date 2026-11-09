import React, { useState } from 'react';
import { requestNotificationPermission } from '../lib/notifications.js';
import { useStore } from '../lib/store.jsx';
import { TONES } from '../lib/constants.js';
import { callAI } from '../lib/ai.js';
import ChipGroup from '../components/ChipGroup.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Icon from '../components/Icons.jsx';
import Avatar from '../components/Avatar.jsx';
import { normalizeProfile } from '../lib/profile.js';

const PERM_LABEL = {
  granted: '已开启',
  denied: '被浏览器拒绝',
  default: '未开启',
  unsupported: '当前浏览器不支持',
};

export default function MineTab({ onEditProfile }) {
  const {
    records,
    settings,
    updateSettings,
    addTag,
    renameTag,
    removeTag,
    exportJSON,
    clearRecords,
    showToast,
    setAiSource,
  } = useStore();
  const [newTag, setNewTag] = useState('');
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [perm, setPerm] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  const submitTag = () => {
    const t = newTag.trim().slice(0, 12);
    if (!t) return;
    if (settings.tags.includes(t)) {
      showToast('这个标签已经有了');
      return;
    }
    addTag(t);
    setNewTag('');
    showToast(`已添加「${t}」`);
  };

  const suggest = async () => {
    setBusy(true);
    try {
      const result = await callAI('suggestTags', {
        existing: settings.tags,
        recent: records.slice(0, 15).map((r) => r.text || '（照片）'),
      });
      setAiSource(result.source);
      const list = (result.data.tags || []).filter((t) => !settings.tags.includes(t));
      setSuggestions(list);
      showToast(list.length ? '建议好了，点一下就能加' : '暂时没有新建议');
    } catch (err) {
      showToast(err.message || '建议失败');
    } finally {
      setBusy(false);
    }
  };

  const requestNotify = async () => {
    if (!('Notification' in window)) {
      showToast('当前浏览器不支持通知');
      return;
    }
    try {
      const p = await requestNotificationPermission();
      setPerm(p);
      showToast(p === 'granted' ? '提醒已开启，页面开着就会弹通知' : '到期列表仍会高亮');
    } catch {
      showToast('授权没成功，到期列表仍会高亮');
    }
  };

  return (
    <div className="page">
      <button type="button" className="profile-settings-card" onClick={onEditProfile}>
        <Avatar profile={settings.profile} decorative />
        <span>
          <strong>{normalizeProfile(settings.profile).nickname}</strong>
          <small>头像与昵称</small>
        </span>
        <Icon name="chevronRight" size={19} />
      </button>
      <section className="card">
        <div className="section-head">
          <h2>默认加工设置</h2>
        </div>
        <div className="field">
          <label>默认语气（每次加工可覆盖）</label>
          <ChipGroup
            options={TONES}
            value={settings.defaultTone}
            onChange={(v) => updateSettings({ defaultTone: v })}
          />
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>主题标签</h2>
          <span className="muted small">{settings.tags.length} 个</span>
        </div>
        <p className="hint">
          用具体主题整理记录，例如「产品灵感」「职场吐槽」「吃喝探店」。你可以添加、改名、删除，日历和灵感库按它筛选。语气在记一笔时单独选择。
        </p>
        {settings.tags.length === 0 ? (
          <p className="hint">还没有标签，先加一个吧。</p>
        ) : (
          <div className="tag-list">
            {settings.tags.map((t) => {
              const count = records.filter((r) => (r.tags || []).includes(t)).length;
              return (
                <div className="tag-row" key={t}>
                  {editing === t ? (
                    <input
                      className="text-input compact"
                      value={editValue}
                      maxLength={12}
                      autoFocus
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameTag(t, editValue);
                          setEditing(null);
                        }
                        if (e.key === 'Escape') setEditing(null);
                      }}
                    />
                  ) : (
                    <span className="tag-name">{t}</span>
                  )}
                  <span className="muted small">{count} 条</span>
                  <div className="tag-actions">
                    {editing === t ? (
                      <>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => {
                            renameTag(t, editValue);
                            setEditing(null);
                          }}
                        >
                          保存
                        </button>
                        <button type="button" className="link-btn" onClick={() => setEditing(null)}>
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`重命名 ${t}`}
                          onClick={() => {
                            setEditing(t);
                            setEditValue(t);
                          }}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          aria-label={`删除 ${t}`}
                          onClick={() => setConfirm({ type: 'tag', name: t })}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="row add-row">
          <input
            className="text-input"
            placeholder="新标签，比如「独立开发」"
            value={newTag}
            maxLength={12}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTag();
            }}
          />
          <button type="button" className="btn primary" onClick={submitTag}>
            <Icon name="plus" size={18} />
            添加
          </button>
        </div>
        <button type="button" className="btn ghost full" disabled={busy} onClick={suggest}>
          <Icon name="refresh" size={18} />
          {busy ? '建议中…' : '根据历史记录自动建议'}
        </button>
        {suggestions.length > 0 && (
          <div className="suggest-box">
            <span className="muted small">点一下加进标签库：</span>
            <div className="chip-group">
              {suggestions.map((t) => (
                <button
                  type="button"
                  key={t}
                  className="chip suggest"
                  onClick={() => {
                    addTag(t);
                    setSuggestions((prev) => prev.filter((x) => x !== t));
                    showToast(`已添加「${t}」`);
                  }}
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-head">
          <h2>提醒</h2>
          <Icon name="bell" size={20} />
        </div>
        <p className="notice-status">浏览器通知：{PERM_LABEL[perm] || perm}</p>
        <p className="hint">通知只在页面打开时生效；到期列表不依赖通知权限。离开网页也要收到提醒，可在提醒详情中添加到手机日历。</p>
        {perm !== 'granted' && (
          <button type="button" className="btn ghost full" onClick={requestNotify}>
            开启浏览器通知
          </button>
        )}
      </section>

      <section className="card">
        <div className="section-head">
          <h2>数据</h2>
          <Icon name="file" size={20} />
        </div>
        <p className="hint">
          记录保存在这台设备的浏览器里。主动加工文字、生成图片或 Q 版头像时，相关文字和选作参考的照片会发送给相应模型服务。头像原照片不写入本机资料，只保存选用的结果。可以导出备份，避免清理浏览器后丢失。
        </p>
        <div className="actions">
          <button type="button" className="btn primary" onClick={exportJSON}>
            <Icon name="download" size={18} />
            导出 JSON
          </button>
          <button
            type="button"
            className="btn ghost danger-outline"
            onClick={() => setConfirm({ type: 'clear' })}
          >
            <Icon name="trash" size={18} />
            清空记录
          </button>
        </div>
      </section>

      <section className="card about-card">
        <div className="section-head">
          <h2>关于臭脑子</h2>
          <span className="muted small">Demo · v0.10</span>
        </div>
        <p className="hint">
          文艺、搞笑、腹黑，怎么说由你决定。输入文字、照片或语音转写，原文一直保留。
        </p>
        <p className="hint">
          扔进一点生活碎片，按你的语气和方向加工。喜欢的一版留下，没想完的接着想，再把今天收进一张封面。
        </p>
        <div className="about-row">
          <Icon name="shield" size={18} />
          <span>本地优先 · 不上传原始记录到第三方数据库</span>
        </div>
      </section>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'clear' ? '清空全部记录？' : '删除这个标签？'}
        message={
          confirm?.type === 'clear'
            ? '将删除本机全部随手记、加工结果和今日打卡，语气与标签设置会保留。建议先导出 JSON 备份。'
            : `「${confirm?.name || ''}」会从标签库和所有记录上移除。`
        }
        confirmText={confirm?.type === 'clear' ? '确认清空' : '删除'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.type === 'clear') {
            clearRecords();
            showToast('记录已清空，设置已保留');
          } else {
            removeTag(confirm.name);
            showToast('标签已删除');
          }
          setConfirm(null);
        }}
      />
    </div>
  );
}
