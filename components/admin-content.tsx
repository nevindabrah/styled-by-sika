'use client';
import { useState } from 'react';
import { ContentEditor } from './content-editor';
import type { ContentOp, SiteContent } from '@/lib/content';

// Live dashboard: each change is saved through the admin API and the fresh content comes back.
export function AdminContent({ content: initial }: { content: SiteContent }) {
  const [content, setContent] = useState(initial);
  async function apply(op: ContentOp) {
    const res = await fetch('/api/admin/content', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setContent(data.content);
    return data.message as string;
  }
  return <ContentEditor content={content} onApply={apply} />;
}
