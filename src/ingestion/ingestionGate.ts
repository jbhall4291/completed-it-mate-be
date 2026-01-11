// ingestionGate.ts

/**
 * Hard reject reasons.
 * Useful for logging / diagnostics, not for control flow.
 */
export type RejectReason =
  | 'no_parent_platforms'
  | 'platform_excluded'
  | 'no_image'
  | 'non_latin_title'
  ;

const DESKTOP_PLATFORMS = new Set([
  'pc',
  'mac',
  'web',
]);

const CONSOLE_PLATFORMS = new Set([
  'playstation',
  'xbox',
  'nintendo',
  'sega',
  'commodore-amiga',
  'atari',
  '3do',
  'neo-geo',
]);

const NON_LATIN_RE = /[^\p{Script=Latin}\d\s:'".\-–—!?,()]/u;

function isMostlyNonLatin(text: string): boolean {
  if (!text) return false;

  const chars = [...text];
  const nonLatin = chars.filter(c => NON_LATIN_RE.test(c)).length;

  return nonLatin / chars.length > 0.6;
}

/* ---------------------------------------------------
   Public API
--------------------------------------------------- */

export default function shouldIngestGame(
  doc: {
    title?: string;
    imageUrl?: string | null;
    parentPlatforms?: string[];
    platformsDetailed?: { slug?: string }[];
  },
  detail: {
    description_raw?: string | null;
    tags?: { name: string; slug: string }[];
  }
): { allowed: true } | { allowed: false; reason: RejectReason } {

  const title = doc.title ?? '';

  // check title for mostly non-latin chars
  if (isMostlyNonLatin(title)) {
    return { allowed: false, reason: 'non_latin_title' };
  }

  /* ---------- Minimum quality / UX ---------- */

  // Must have at least one parent platform, or at least one detailed platform
  const hasParent = (doc.parentPlatforms?.length ?? 0) > 0;
  const hasDetailed = (doc.platformsDetailed?.length ?? 0) > 0;

  if (!hasParent && !hasDetailed) {
    return { allowed: false, reason: 'no_parent_platforms' };
  }

  // Must have an image (card UI depends on this)
  if (!doc.imageUrl) {
    return { allowed: false, reason: 'no_image' };
  }

  /* ---------- Platform hygiene ---------- */

  const slugs = new Set<string>([
    ...(doc.parentPlatforms ?? []).map(s => s.toLowerCase()),
    ...(doc.platformsDetailed ?? []).map(p => (p.slug || '').toLowerCase()),
  ]);

  // Desktop-only games (PC / Mac / Web) → reject
  const hasConsole = [...slugs].some(s => CONSOLE_PLATFORMS.has(s));

  if (!hasConsole) {
    return { allowed: false, reason: 'platform_excluded' };
  }

  return { allowed: true };
}
