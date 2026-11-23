import type { APIRoute, GetStaticPaths } from 'astro';
import { latestPosts } from '../../lib/instagram';

// The Instagram photos are saved with the site when it is built, so
// visitors fetch nothing from other services.
export const getStaticPaths: GetStaticPaths = async () =>
  (await latestPosts()).map(({ id, image }) => ({
    params: { id },
    props: { image },
  }));

export const GET: APIRoute = ({ props }) =>
  new Response(props.image, { headers: { 'Content-Type': 'image/webp' } });
