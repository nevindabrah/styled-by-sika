// Photos shown beside the matching menu category, in display order.
// Store files in public/images/styles/<category>/ and add them here (see docs/ADDING-PHOTOS.md).
// `own` marks Sika's own client work; the "Braided by Sika" caption only appears when every photo in a category is hers.
export type WorkPhoto = { url: string; alt: string; width: number; height: number; own?: boolean };

export const workPhotos: Record<string, WorkPhoto[]> = {
  knotless: [
    { url: '/images/styles/knotless/knotless-03.jpg', width: 495, height: 619, alt: 'Long medium knotless braids in an ombré brown, showing the neat square parts at the roots' },
    { url: '/images/styles/knotless/knotless-01.jpeg', width: 916, height: 2298, own: true, alt: 'Knotless braids with loose curls, showing the sections and full length from the back' },
    { url: '/images/styles/knotless/knotless-02.jpeg', width: 904, height: 2266, own: true, alt: 'Knotless braids with loose curls, shown from the side and back' },
  ],
  boho: [
    { url: '/images/styles/boho/boho-01.jpg', width: 675, height: 1200, alt: 'Long boho knotless braids with loose curly strands throughout, worn down' },
  ],
  'miracle-knots': [
    { url: '/images/styles/miracle-knots/miracle-knots-01.jpg', width: 387, height: 516, alt: 'Miracle knots with long defined curls, shown from the side' },
    { url: '/images/styles/miracle-knots/miracle-knots-02.jpg', width: 768, height: 1024, alt: 'Miracle knots with full, shiny curls framing the face' },
  ],
  twists: [
    { url: '/images/styles/twists/twists-01.jpg', width: 480, height: 640, alt: 'Long Marley twists with loose curly ends and highlights, shown from the back' },
  ],
  'invisible-locs': [
    { url: '/images/styles/invisible-locs/invisible-locs-01.jpg', width: 1199, height: 1600, alt: 'Invisible locs from the back, showing the neat parts and full length' },
  ],
  'soft-locs': [
    { url: '/images/styles/soft-locs/soft-locs-01.jpg', width: 736, height: 1308, alt: 'Long soft locs worn down, shown from the side' },
  ],
};
