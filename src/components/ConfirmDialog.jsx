import React from 'react';

export default function ConfirmDialog({ open, title, message, confirmText = '确定', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-mask" onClick={onCancel} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-msg">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>取消</button>
          <button type="button" className="btn primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
