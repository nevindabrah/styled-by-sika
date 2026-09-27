import type { NextConfig } from 'next';
// The public site is one page; former pages redirect to their section.
const sections: [string, string][] = [['/styles', '/#services'], ['/styles/:slug', '/#services'], ['/pricing', '/#services'], ['/gallery', '/#services'], ['/policies', '/#before-you-book'], ['/faq', '/#before-you-book'], ['/contact', '/#contact'], ['/about', '/#meet-sika']];
const config: NextConfig = { poweredByHeader: false, outputFileTracingRoot: process.cwd(), distDir: process.env.NEXT_DIST_DIR || '.next', async redirects() { return sections.map(([source, destination]) => ({ source, destination, permanent: false })); }, async headers() { return [{ source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'DENY' }] }]; } };
export default config;
