import { getCollection, type CollectionEntry } from 'astro:content';
import site from '../data/site.json';

export { site };
export type Service = CollectionEntry<'services'>;
export type Project = CollectionEntry<'projects'>;

/** Returns a site path with the configured base in front. */
export function url(path = ''): string {
  return import.meta.env.BASE_URL.replace(/\/?$/, '/') + path;
}

export async function allServices(): Promise<Service[]> {
  const services = await getCollection('services');
  return services.sort((a, b) => a.data.order - b.data.order);
}

export async function publishedProjects(): Promise<Project[]> {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  return projects.sort((a, b) => b.data.year - a.data.year);
}
