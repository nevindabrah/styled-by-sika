import Image from 'next/image';
export function BraiderIntro({ title, body, photo }: { title: string; body: string; photo: { url: string; alt: string; width: number; height: number } }) {
  return (
    <aside id="meet-sika" className="braider-intro" aria-labelledby="braider-intro-heading">
      <div className="braider-portrait"><div className="braider-portrait-inner">
        <Image src={photo.url} alt={photo.alt} fill sizes="(max-width: 760px) 120px, 160px" className="braider-portrait-image" priority unoptimized={!photo.url.startsWith('/')} />
      </div>
      </div>
      <div className="braider-intro-copy">
        <div className="eyebrow">MEET YOUR BRAIDER</div>
        <h2 id="braider-intro-heading">{title}</h2>
        <p>{body}</p>
      </div>
    </aside>
  );
}
