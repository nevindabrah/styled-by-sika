'use client';
import { useEffect, useState } from 'react';
import { isDemo, readDemoContent } from './demo';
import { publicContent, type SiteContent } from './content';

// The server renders the saved content; in the demo, edits made in this tab are layered on after mount.
export function useSiteContent(initial: SiteContent): SiteContent {
  const [content, setContent] = useState(initial);
  useEffect(() => { setContent(isDemo ? publicContent(readDemoContent(initial)) : initial); }, [initial]);
  return content;
}
