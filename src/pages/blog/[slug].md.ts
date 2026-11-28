import type { APIRoute, GetStaticPaths } from 'astro';
import { allPosts, postMarkdown, type Post } from '../../lib/posts';

// A plain Markdown copy of each post, which llms.txt points AI assistants to.
export const getStaticPaths: GetStaticPaths = async () =>
  (await allPosts()).map((post) => ({ params: { slug: post.id }, props: { post } }));

export const GET: APIRoute = ({ props }) =>
  new Response(postMarkdown(props.post as Post), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
