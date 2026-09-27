# Add photos to a menu category

The two supplied knotless photos are saved in `public/images/styles/knotless/` and listed in `lib/work-photos.ts`. Photos appear next to the matching category heading in the service menu.

1. Copy the new photo into `public/images/styles/knotless/`, for example `knotless-03.jpeg`.
2. Open `lib/work-photos.ts` and add another entry inside the `knotless` array (width and height are the image's pixel size):

```ts
{ url: '/images/styles/knotless/knotless-03.jpeg', width: 900, height: 2200, alt: 'Describe the hairstyle and the angle shown in this photo' },
```

Add `own: true` when the photo is Sika's own client work; the "Braided by Sika" caption shows only when every photo in that category is marked. The array order is the display order. To add photos for another category, add a key matching its slug in `lib/menu.ts` (`boho`, `twists`, `invisible-locs`, `soft-locs`) (`miracle-knots` too) with its own array. Keep each filename unique and leave `public` out of the URL.

Use `npm run dev` and the terminal's preview URL (usually port 3000) for immediate updates. The port 3002 built demo needs `npm run demo:build` and a restart after edits.

This is a file-based workflow for now; the admin dashboard does not yet have photo uploads. The original attachments were copied, so the website no longer depends on temporary Photos export paths.
