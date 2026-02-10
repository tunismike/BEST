import type { EffectiveItem } from '../types';

export function exportToJson(items: EffectiveItem[]): string {
  const data = items.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category ?? '',
    description: item.description ?? '',
    link: item.link ?? '',
    status: item.status,
    isEdited: item.isEdited,
    statusUpdatedAt: item.statusUpdatedAt ?? '',
    editUpdatedAt: item.editUpdatedAt ?? '',
  }));
  return JSON.stringify(data, null, 2);
}

export function exportToCsv(items: EffectiveItem[]): string {
  const headers = [
    'id',
    'title',
    'category',
    'description',
    'link',
    'status',
    'isEdited',
    'statusUpdatedAt',
    'editUpdatedAt',
  ];

  const escapeCell = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = items.map((item) =>
    [
      item.id,
      item.title,
      item.category ?? '',
      item.description ?? '',
      item.link ?? '',
      item.status,
      String(item.isEdited),
      item.statusUpdatedAt ?? '',
      item.editUpdatedAt ?? '',
    ]
      .map(escapeCell)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
