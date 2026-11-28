import { site } from './site';

const MAX_POSTS = 9;

export interface InstagramPost {
  id: string;
  link: string;
  alt: string;
  width: number;
  height: number;
  /** The photo itself, fetched while the site is built. */
  image: ArrayBuffer;
}

let loaded: Promise<InstagramPost[]> | undefined;

async function fetchOk(address: string): Promise<Response> {
  const response = await fetch(address);
  if (!response.ok) {
    throw new Error(`${address} answered ${response.status}`);
  }
  return response;
}

async function load(): Promise<InstagramPost[]> {
  if (!site.instagram.url || !site.instagram.feed) return [];
  try {
    const { posts } = await (await fetchOk(site.instagram.feed)).json();
    // Whole rows of three once there are three; below that every post shows
    // and the component fills the row with a link to the profile.
    const count = Math.min(posts.length, MAX_POSTS);
    const shown = count < 3 ? count : count - (count % 3);
    return await Promise.all(
      posts.slice(0, shown).map(async (post: any) => {
        const { mediaUrl, width, height } = post.sizes.medium;
        return {
          id: post.id,
          link: post.permalink,
          alt: post.altText ?? post.prunedCaption ?? '',
          width,
          height,
          image: await (await fetchOk(mediaUrl)).arrayBuffer(),
        };
      }),
    );
  } catch (error) {
    console.warn('Instagram feed not read, showing the plain link:', error);
    return [];
  }
}

/**
 * Returns the newest posts from the Behold feed, photos included, read
 * once while the site is built. Returns none when no feed is set or any
 * part of it cannot be read, so the page falls back to a plain link to
 * the profile.
 */
export function latestPosts(): Promise<InstagramPost[]> {
  return (loaded ??= load());
}
