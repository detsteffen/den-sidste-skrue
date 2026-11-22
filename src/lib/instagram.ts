import { site } from './site';

export interface InstagramPost {
  link: string;
  image: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Returns the newest posts from the configured Behold feed, read while the
 * site is built. Returns none when no feed is set or it cannot be read, so
 * the page falls back to a plain link to the profile.
 */
export async function latestPosts(limit = 9): Promise<InstagramPost[]> {
  if (!site.instagram.feed) return [];
  try {
    const response = await fetch(site.instagram.feed);
    if (!response.ok) return [];
    const { posts } = await response.json();
    // Whole rows of three only, so the grid never ends on a ragged row.
    const count = Math.min(posts.length, limit);
    return posts.slice(0, count - (count % 3)).map((post: any) => ({
      link: post.permalink,
      image: post.sizes.medium.mediaUrl,
      width: post.sizes.medium.width,
      height: post.sizes.medium.height,
      alt: post.altText ?? post.prunedCaption ?? '',
    }));
  } catch {
    return [];
  }
}
