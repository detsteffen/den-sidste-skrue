export const CATEGORY_IDS = [
  'badevaerelse',
  'fliser',
  'toemrerarbejde',
  'foer-du-gaar-i-gang',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Category {
  name: string;
  title: string;
  lead: string;
  /** The question the call to action under each article asks. */
  cta: string;
}

export const CATEGORIES: Record<CategoryId, Category> = {
  badevaerelse: {
    name: 'Badeværelse',
    title: 'Guides om badeværelser',
    lead: 'Priser, regler for vådrum og hvordan en renovering forløber, fra det gamle bliver revet ud til den sidste fuge.',
    cta: 'Skal dit badeværelse laves om?',
  },
  fliser: {
    name: 'Fliser',
    title: 'Guides om fliser',
    lead: 'Hvad flisearbejde koster, hvilke fliser og fuger du skal vælge, og hvad der skal til for at resultatet holder.',
    cta: 'Skal du have lagt fliser?',
  },
  toemrerarbejde: {
    name: 'Tømrerarbejde',
    title: 'Guides om tømrerarbejde',
    lead: 'Tag, vinduer, gulve, terrasser og ældre huse: priser, materialer og det, du skal vide, før du går i gang.',
    cta: 'Har du en opgave til en tømrer?',
  },
  'foer-du-gaar-i-gang': {
    name: 'Før du går i gang',
    title: 'Før du går i gang',
    lead: 'Tilbud, aftaler, fradrag og byggetilladelser. Det praktiske, der er godt at have styr på, før håndværkeren kommer.',
    cta: 'Klar til at få en pris?',
  },
};

const WORDS_PER_MINUTE = 200;

/** Returns the reading time of a Markdown text in whole minutes. */
export function readingMinutes(markdown = ''): number {
  return Math.max(
    1,
    Math.round(markdown.split(/\s+/).length / WORDS_PER_MINUTE),
  );
}

/** Turns a Danish word into a lowercase ASCII anchor, as in "vaadrum". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('æ', 'ae')
    .replaceAll('ø', 'oe')
    .replaceAll('å', 'aa')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const dateFormat = new Intl.DateTimeFormat('da-DK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Formats a date the Danish way, as in "28. november 2026". */
export function danishDate(date: Date): string {
  return dateFormat.format(date);
}
