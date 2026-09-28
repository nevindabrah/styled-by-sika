// The site's eight-spoked star, drawn as SVG so phones never swap it for a colour emoji.
export function Spark({ weight = 1.5 }: { weight?: number }) {
  return <svg className="spark" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round">
    <path d="M12 1.5v21M1.5 12h21M4.6 4.6l14.8 14.8M19.4 4.6 4.6 19.4" />
  </svg>;
}
