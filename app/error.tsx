'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="error-page"><h1 className="page-title" style={{marginInline:'auto'}}>Unable to load this page.</h1><p>We couldn’t load this page. Please try again in a moment.</p><button className="button" onClick={reset}>Try again</button></main>;}
