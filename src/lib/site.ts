import type { ImageMetadata } from 'astro';
import areas from '../data/areas.json';
import site from '../data/site.json';

export { areas, site };

const photos = import.meta.glob<ImageMetadata>('../assets/fotos/*.jpg', {
  eager: true,
  import: 'default',
});

/** Returns a site path with the configured base in front. */
export function url(path = ''): string {
  return import.meta.env.BASE_URL.replace(/\/?$/, '/') + path;
}

/** Returns the photo with the given file name in src/assets/fotos. */
export function photo(name: string): ImageMetadata {
  return photos[`../assets/fotos/${name}.jpg`];
}
