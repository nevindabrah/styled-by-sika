import Image from 'next/image';
import { braiderProfile, braiderFirstName } from '@/lib/braider-profile';

export function BraiderIntro({ title, body }: { title: string; body: string }) {
  return (
    <aside id="meet-sika" className="braider-intro" aria-labelledby="braider-intro-heading">
      <div className="braider-portrait"><div className="braider-portrait-inner">
        {braiderProfile.photo ? (
          <Image src={braiderProfile.photo} alt={braiderProfile.name} fill sizes="(max-width: 760px) 120px, 160px" className="braider-portrait-image" priority />
        ) : (
          <div className="braider-portrait-placeholder" role="img" aria-label={`${braiderFirstName}’s portrait will be added here`}>
            <span aria-hidden="true">{braiderFirstName[0]}.</span>
            <small>Photo coming soon</small>
          </div>
        )}
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
