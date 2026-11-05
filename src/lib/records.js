import { dateKeyOf, todayKey } from './time.js';
import { normalizeTag, normalizeTone } from './constants.js';

export const LIBRARY_SECTIONS = [
  {
    id: 'ideas',
    name: '脑洞',
    english: 'IDEAS',
    description: '想法和它长出的下一步',
    icon: 'sparkles',
    color: 'purple',
    match: (r) => r.outputs.some((o) => o.kind === 'extend'),
  },
  {
    id: 'rewrites',
    name: '换语',
    english: 'REPHRASE',
    description: '文艺、搞笑、腹黑，随你',
    icon: 'note',
    color: 'green',
    match: (r) => r.outputs.some((o) => ['rewrite', 'caption'].includes(o.kind)),
  },
  {
    id: 'covers',
    name: '图片',
    english: 'IMAGES',
    description: '随手拍与文字封面',
    icon: 'image',
    color: 'orange',
    match: (r) => Boolean(r.cover || r.photoDataUrl),
  },
  {
    id: 'pending',
    name: '再思',
    english: 'RETHINK',
    description: '没想完的，下次接着来',
    icon: 'clock',
    color: 'slate',
    match: (r) => r.pending,
  },
];

export function recordMatches(record, query) {
  return [
    record.text,
    record.cover?.title,
    record.caption,
    record.continuationQuestion,
    ...record.tags,
    ...record.outputs.map((o) => o.text),
    ...record.notes.map((n) => n.text),
  ]
    .join(' ')
    .toLowerCase()
    .includes(query.trim().toLowerCase());
}

export function recordTags(records) {
  const counts = new Map();
  records.forEach((r) => r.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  return [...counts].sort((a, b) => b[1] - a[1]);
}

export const COLLECTIONS = [
  {
    id: 'projects',
    name: '项目',
    english: 'PROJECTS',
    description: '正在动手做的事',
    icon: 'target',
    color: 'purple',
  },
  {
    id: 'areas',
    name: '领域',
    english: 'AREAS',
    description: '一直在意的生活',
    icon: 'grid',
    color: 'green',
  },
  {
    id: 'resources',
    name: '资源',
    english: 'RESOURCES',
    description: '灵感、素材与碎片',
    icon: 'layers',
    color: 'orange',
  },
  {
    id: 'archives',
    name: '归档',
    english: 'ARCHIVES',
    description: '告一段落，也留着',
    icon: 'archive',
    color: 'slate',
  },
];

export function normalizeRecord(record) {
  return {
    ...record,
    dateKey: record.dateKey || dateKeyOf(record.createdAt),
    outputs: Array.isArray(record.outputs) ? record.outputs : [],
    tags: Array.isArray(record.tags) ? [...new Set(record.tags.map(normalizeTag))] : [],
    tone: normalizeTone(record.tone),
    notes: Array.isArray(record.notes) ? record.notes : [],
    collection: COLLECTIONS.some((c) => c.id === record.collection)
      ? record.collection
      : 'resources',
    selectedOutputId: record.selectedOutputId || '',
    continuationQuestion: record.continuationQuestion || '',
    pending: Boolean(record.pending),
  };
}

export function selectedOutput(record) {
  return record.outputs?.find((output) => output.id === record.selectedOutputId);
}

export function recordTitle(record) {
  return (
    record.cover?.title ||
    selectedOutput(record)?.text ||
    record.caption ||
    record.text ||
    '一张随手拍'
  );
}

export function exampleRecords() {
  const createdAt = new Date().toISOString();
  const dateKey = todayKey();
  return [
    normalizeRecord({
      id: 'example-idea',
      kind: 'text',
      text: '想做个跑步工具，每次断签以后，我就懒得再打开了。',
      createdAt,
      dateKey,
      tags: ['点子'],
      collection: 'projects',
      pending: true,
      continuationQuestion: '断签以后，让人烦的是归零，还是被催？',
      selectedOutputId: 'example-output',
      outputs: [
        {
          id: 'example-output',
          text: '先做一个只约下一次的跑步页面，找三个断过打卡的人试试。',
          kind: 'extend',
          tone: '温和',
          direction: '正经好用',
          source: 'example',
          createdAt,
        },
      ],
      isExample: true,
    }),
    normalizeRecord({
      id: 'example-life',
      kind: 'text',
      text: '下班买了束花，回家才发现忘了买晚饭。',
      createdAt,
      dateKey,
      tags: ['日常'],
      collection: 'areas',
      cover: {
        title: '花已入住，\n晚饭仍在路上。',
        body: '',
        footer: '臭脑子 · 留下今天',
        tone: '幽默',
        direction: '无厘头',
        createdAt,
        includeOriginal: false,
        includePhoto: false,
      },
      isExample: true,
    }),
  ];
}
