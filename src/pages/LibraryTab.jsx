import React, { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { LIBRARY_SECTIONS, recordMatches } from '../lib/records.js';
import RecordRow from '../components/RecordRow.jsx';
import ImageTile from '../components/ImageTile.jsx';
import TagFilter from '../components/TagFilter.jsx';
import EmptyState from '../components/EmptyState.jsx';
import CollectionGlyph from '../components/CollectionGlyph.jsx';

export default function LibraryTab({ query = '' }) {
  const { records } = useStore();
  const [section, setSection] = useState('');
  const [tag, setTag] = useState('');
  const selected = LIBRARY_SECTIONS.find((item) => item.id === section);
  const base = records.filter((r) => (!selected || selected.match(r)) && recordMatches(r, query));
  const filtered = base.filter((r) => !tag || r.tags.includes(tag));
  return (
    <div className="page library-page">
      <TagFilter records={base} value={tag} onChange={setTag} />
      <div className="collection-grid">
        {LIBRARY_SECTIONS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`collection-tile ${item.color} ${section === item.id ? 'chosen' : ''}`}
            aria-pressed={section === item.id}
            onClick={() => {
              setSection(section === item.id ? '' : item.id);
              setTag('');
            }}
          >
            <span className="collection-count">{records.filter(item.match).length}</span>
            <span className="collection-wordmark">
              <strong>{item.name}</strong>
              <small>{item.english}</small>
            </span>
            <span className="collection-graphic">
              <CollectionGlyph name={item.id} />
            </span>
          </button>
        ))}
      </div>
      <section className="library-records">
        <div className="section-head">
          <h2>
            {selected?.name || '全部收录'}
            <small>{filtered.length} 条</small>
          </h2>
          {section && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setSection('');
                setTag('');
              }}
            >
              查看全部
            </button>
          )}
        </div>
        {filtered.length ? (
          <div className={section === 'covers' ? 'image-grid' : 'entry-list'}>
            {filtered.map((r) =>
              section === 'covers' ? (
                <ImageTile key={r.id} record={r} />
              ) : (
                <RecordRow key={r.id} record={r} showDate />
              ),
            )}
          </div>
        ) : (
          <EmptyState
            icon={selected?.icon || 'layers'}
            title={
              query
                ? '没有找到相关内容'
                : selected
                  ? `还没有${selected.name}`
                  : '加工过的念头，收在这里'
            }
            desc={
              selected?.id === 'pending'
                ? '打开记录，留下一个想继续的问题。'
                : selected?.id === 'covers'
                  ? '记一笔时加照片，也可以把喜欢的一句话做成封面。'
                  : '记一笔，选个语气，让它换个说法或长出点子。'
            }
          />
        )}
      </section>
    </div>
  );
}
