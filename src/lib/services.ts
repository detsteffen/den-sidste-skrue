import { getCollection, type CollectionEntry } from 'astro:content';

export type Service = CollectionEntry<'services'>;

/** Returns every service in the order Vi udfører lists them. */
export async function allServices(): Promise<Service[]> {
  return (await getCollection('services')).sort(
    (a, b) => a.data.order - b.data.order,
  );
}
