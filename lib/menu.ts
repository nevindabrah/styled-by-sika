// Sika's service menu, exactly as supplied by the owner. Prices are CAD cents; durations are minutes.
// Edit this file to change what the website shows. `npm run db:seed` copies it to Supabase.

export const categories = [
  { slug: 'knotless', label: 'Knotless braids', short: 'Knotless' },
  { slug: 'boho', label: 'Boho knotless braids', short: 'Boho' },
  { slug: 'miracle-knots', label: 'Miracle knots', short: 'Miracle knots' },
  { slug: 'twists', label: 'Twists', short: 'Twists' },
  { slug: 'invisible-locs', label: 'Invisible locs', short: 'Invisible locs' },
  { slug: 'soft-locs', label: 'Soft locs', short: 'Soft locs' },
] as const;

// `minutes` is a number, or [shortest, longest] when the appointment length is a range.
type MenuService = [slug: string, category: string, name: string, minutes: number | [number, number], dollars: number, description: string, hair: string];

const bohoHair = (braiding: string, note = 'Boho/curl extensions required.') =>
  `${braiding} packs of pre-stretched braiding hair and ${braiding} packs of boho hair recommended. ${note}`;
const twistHair = '3 packs of twist hair. Boho curls are optional and must be provided by the client.';
const softLocHair = '3–4 packs of loc extensions and 1 pack of spring-twist hair. Barrel ends and boho styling are available as add-ons.';

export const menuServices: MenuService[] = [
  ['large-knotless-standard', 'knotless', 'Large Knotless Braids — Standard Back Length', 300, 120, 'Large knotless braids to standard back length.', '3 packs of pre-stretched braiding hair.'],
  ['large-knotless-shoulder', 'knotless', 'Large Knotless Braids — Shoulder Length', 210, 150, 'Large knotless braids to shoulder length.', '3 packs of pre-stretched braiding hair.'],
  ['large-knotless-mid-back', 'knotless', 'Large Knotless Braids — Mid-Back Length', 270, 170, 'Large knotless braids to mid-back length.', '3 packs of pre-stretched braiding hair.'],
  ['medium-knotless-standard', 'knotless', 'Medium Knotless Braids — Standard Back Length', 450, 150, 'Medium knotless braids to standard back length.', '3–4 packs of pre-stretched braiding hair.'],
  ['small-medium-knotless-standard', 'knotless', 'S-Medium Knotless Braids — Standard Back Length', 510, 180, 'Small-medium knotless braids to standard back length.', '3–4 packs of pre-stretched braiding hair.'],
  ['small-knotless-shoulder', 'knotless', 'Small Knotless Braids — Shoulder Length', 345, 180, 'Small knotless braids to shoulder length.', '4 packs of pre-stretched braiding hair.'],
  ['small-knotless-mid-back', 'knotless', 'Small Knotless Braids — Mid-Back Length', 390, 220, 'Small knotless braids to mid-back length.', '4 packs of pre-stretched braiding hair.'],

  ['large-boho-standard', 'boho', 'Large Boho Knotless Braids — Standard Back Length', 210, 180, 'Large boho knotless braids to standard back length.', bohoHair('3')],
  ['medium-boho-standard', 'boho', 'Medium Boho Knotless Braids — Standard Back Length', 300, 220, 'Medium boho knotless braids to standard back length.', bohoHair('3')],
  ['small-medium-boho-standard', 'boho', 'S-Medium Boho Knotless Braids — Standard Back Length', 390, 250, 'Small-medium boho knotless braids to standard back length.', bohoHair('3–4', 'Human hair is recommended for the curls.')],
  ['large-boho-shoulder', 'boho', 'Large Boho Knotless Braids — Shoulder Length', 180, 150, 'Large boho knotless braids to shoulder length.', bohoHair('3')],
  ['large-boho-mid-back', 'boho', 'Large Boho Knotless Braids — Mid-Back Length', 240, 170, 'Large boho knotless braids to mid-back length.', bohoHair('3')],
  ['small-medium-boho-shoulder', 'boho', 'S-Medium Boho Knotless Braids — Shoulder Length', 240, 180, 'Small-medium boho knotless braids to shoulder length.', bohoHair('3–4')],
  ['small-medium-boho-mid-back', 'boho', 'S-Medium Boho Knotless Braids — Mid-Back Length', 270, 200, 'Small-medium boho knotless braids to mid-back length.', bohoHair('3–4')],

  ['medium-miracle-knots-shoulder', 'miracle-knots', 'Medium Miracle Knots — Shoulder Length', [300, 360], 120, 'Medium miracle knots to shoulder length.', '4–5 packs of braiding hair needed.'],
  ['small-miracle-knots-shoulder', 'miracle-knots', 'Small Miracle Knots — Shoulder Length', [360, 420], 150, 'Small miracle knots to shoulder length.', '5–6 packs of braiding hair needed.'],
  ['medium-miracle-knots-mid-back', 'miracle-knots', 'Medium Miracle Knots — Mid-Back Length', 360, 160, 'Medium miracle knots to mid-back length.', '4–5 packs of braiding hair needed.'],
  ['small-miracle-knots-mid-back', 'miracle-knots', 'Small Miracle Knots — Mid-Back Length', [420, 480], 180, 'Small miracle knots to mid-back length.', '5–6 packs of braiding hair needed.'],

  ['large-marley-island-twists', 'twists', 'Large Marley / Island Twists', 240, 120, 'Large Marley or Island twists to standard back length.', '3 packs of pre-stretched braiding hair or afro-kinky extensions.'],
  ['medium-marley-island-twists', 'twists', 'Medium Marley / Island Twists', 330, 150, 'Medium Marley or Island twists to standard back length.', '3 packs of pre-stretched braiding hair or afro-kinky extensions.'],
  ['small-marley-island-twists', 'twists', 'Small Marley / Island Twists', 450, 180, 'Small Marley or Island twists to standard back length.', '3–4 packs of pre-stretched braiding hair or afro-kinky extensions.'],
  ['natural-hair-twists', 'twists', 'Natural Hair Twists', 120, 60, 'Natural-hair twists available in small, medium, or large sizes.', 'No extensions needed.'],

  ['large-invisible-locs', 'invisible-locs', 'Large Invisible Locs', 300, 100, 'Large invisible locs from shoulder to mid-back length.', twistHair],
  ['medium-invisible-locs', 'invisible-locs', 'Medium Invisible Locs', 330, 120, 'Medium invisible locs from shoulder to mid-back length.', twistHair],
  ['small-invisible-locs', 'invisible-locs', 'Small Invisible Locs', 420, 190, 'Small invisible locs from shoulder to mid-back length.', twistHair],

  ['small-medium-soft-locs-shoulder', 'soft-locs', 'Small/Medium Soft Locs — Shoulder Length', 300, 120, 'Small-medium soft locs to shoulder length.', softLocHair],
  ['small-medium-soft-locs-standard', 'soft-locs', 'Small/Medium Soft Locs — Standard Length', 330, 150, 'Small-medium soft locs to standard length. Final length may vary depending on the extensions provided.', softLocHair],
];

type MenuExtra = { slug: string; group: 'boho' | 'additional'; name: string; dollars: number; maxDollars?: number; plus?: boolean; description: string; bookable?: boolean };

export const extraGroups = [
  { slug: 'boho', label: 'Boho add-ons' },
  { slug: 'additional', label: 'Additional services' },
] as const;

export const menuExtras: MenuExtra[] = [
  { slug: 'boho-curl-add-on', group: 'boho', name: 'Boho/Curl Add-On', dollars: 30, maxDollars: 50, description: 'Add boho or curl detailing to eligible styles. It is recommended that you provide the same number of packs of boho hair as the required pre-stretched braiding hair. Boho/curl extensions are required.' },
  { slug: 'human-hair-curls', group: 'boho', name: 'Human Hair Curls', dollars: 0, bookable: false, description: 'Recommended for a neat, long-lasting finish. Human hair curls must be provided by you :)' },
  { slug: 'blow-dry', group: 'additional', name: 'Blow-Dry', dollars: 25, description: '' },
  { slug: 'take-down', group: 'additional', name: 'Take-Down', dollars: 30, plus: true, description: 'Depending on hair fullness and length.' },
  { slug: 'extra-length', group: 'additional', name: 'Extra Length', dollars: 20, maxDollars: 50, description: '' },
  { slug: 'extra-fullness', group: 'additional', name: 'Extra Fullness', dollars: 20, maxDollars: 40, description: '' },
];
