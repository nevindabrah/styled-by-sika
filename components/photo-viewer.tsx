'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Photo } from '@/lib/content';

// Full-screen photo view: swipe or use the arrows, tap outside or Close to go back.
export function PhotoViewer({ photos, index: start, label, onClose }: { photos: Photo[]; index: number; label: string; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const dialog = useRef<HTMLDialogElement>(null);
  const swipe = useRef<number | null>(null);
  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; if (d?.open) d.close(); };
  }, []);
  const move = (step: number) => setIndex(i => (i + step + photos.length) % photos.length);
  const photo = photos[index];
  return <dialog ref={dialog} className="photo-viewer" aria-label={`${label} photos`}
    onCancel={e => { e.preventDefault(); onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    onKeyDown={e => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); }}>
    <button type="button" className="icon-button photo-viewer-close" aria-label="Close photo" onClick={onClose}><X size={20} /></button>
    <figure className="photo-viewer-figure"
      onPointerDown={e => { swipe.current = e.clientX; }}
      onPointerUp={e => { if (swipe.current === null) return; const dx = e.clientX - swipe.current; swipe.current = null; if (Math.abs(dx) > 40 && photos.length > 1) move(dx < 0 ? 1 : -1); }}
      onPointerCancel={() => { swipe.current = null; }}>
      <Image key={photo.id} src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} unoptimized draggable={false} />
      <figcaption>{label}{photos.length > 1 && <> · {index + 1} of {photos.length}</>}</figcaption>
    </figure>
    {photos.length > 1 && <div className="photo-viewer-controls">
      <button type="button" className="icon-button" aria-label="Previous photo" onClick={() => move(-1)}><ChevronLeft size={22} /></button>
      <button type="button" className="icon-button" aria-label="Next photo" onClick={() => move(1)}><ChevronRight size={22} /></button>
    </div>}
  </dialog>;
}
