import type { ImageMetadata } from 'astro';

const files = import.meta.glob<ImageMetadata>('../assets/ydelser/*.jpg', {
  eager: true,
  import: 'default',
});

/** Returns the photo named after a service, if there is one. */
export function servicePhoto(id: string): ImageMetadata | undefined {
  return files[`../assets/ydelser/${id}.jpg`];
}
