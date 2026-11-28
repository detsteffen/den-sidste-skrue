import type { APIRoute, GetStaticPaths } from 'astro';
import { instagramFeed } from '../../lib/instagram';

// The Instagram photos are saved with the site when it is built, so
// visitors fetch nothing from other services.
export const getStaticPaths: GetStaticPaths = async () => {
  const { posts, picture } = await instagramFeed();
  const photos = posts.map(({ id, image }) => ({ id, image }));
  if (picture) photos.push({ id: 'profil', image: picture });
  return photos.map(({ id, image }) => ({ params: { id }, props: { image } }));
};

export const GET: APIRoute = ({ props }) =>
  new Response(props.image, { headers: { 'Content-Type': 'image/webp' } });
