import React from 'react';
import Icon from './Icons.jsx';

export default function EmptyState({ icon = 'note', title = '这里还空着', desc = '', actionText = '', onAction }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={30} /></div>
      <div className="empty-title">{title}</div>
      {desc && <p className="empty-desc">{desc}</p>}
      {actionText && onAction && (
        <button type="button" className="btn ghost" onClick={onAction}>{actionText}</button>
      )}
    </div>
  );
}
