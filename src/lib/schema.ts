import { site, url } from './site';

/** Returns the full address of a site path, base and host included. */
export function absolute(path = ''): string {
  return new URL(url(path), import.meta.env.SITE).href;
}

/** The firm as schema.org sees it; other pages point to it by its id. */
export const business = {
  '@type': 'GeneralContractor',
  '@id': absolute('#firma'),
  name: site.name,
  slogan: site.slogan,
  url: absolute(),
  telephone: site.phoneHref,
  email: site.email,
  founder: { '@type': 'Person', name: site.owner },
  areaServed: { '@type': 'City', name: site.city },
  ...(site.instagram.url && { sameAs: [site.instagram.url] }),
};

/** Returns a schema.org breadcrumb trail from the front page down. */
export function breadcrumbs(trail: { path: string; name: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ path: '', name: 'Forside' }, ...trail].map(
      ({ path, name }, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        item: absolute(path),
      }),
    ),
  };
}
