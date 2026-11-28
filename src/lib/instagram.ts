import { site } from './site';

const MAX_POSTS = 9;

export interface InstagramPost {
  id: string;
  link: string;
  alt: string;
  caption: string;
  date: Date;
  /** True for albums and videos, which hold more than the photo shown. */
  more: boolean;
  width: number;
  height: number;
  /** The photo itself, fetched while the site is built. */
  image: ArrayBuffer;
}

export interface InstagramFeed {
  posts: InstagramPost[];
  /** The profile picture, fetched with the posts. */
  picture?: ArrayBuffer;
}

let loaded: Promise<InstagramFeed> | undefined;

async function download(address: string): Promise<Response> {
  const response = await fetch(address);
  if (!response.ok) {
    throw new Error(`${address} answered ${response.status}`);
  }
  return response;
}

async function photo(address: string): Promise<ArrayBuffer> {
  return (await download(address)).arrayBuffer();
}

async function load(): Promise<InstagramFeed> {
  if (!site.instagram.url || !site.instagram.feed) return { posts: [] };
  try {
    const feed = await (await download(site.instagram.feed)).json();
    const posts = await Promise.all(
      feed.posts.slice(0, MAX_POSTS).map(async (post: any) => {
        const { mediaUrl, width, height } = post.sizes.large;
        return {
          id: post.id,
          link: post.permalink,
          alt: post.altText ?? post.prunedCaption ?? '',
          caption: post.prunedCaption ?? '',
          date: new Date(post.timestamp),
          more: post.mediaType !== 'IMAGE',
          width,
          height,
          image: await photo(mediaUrl),
        };
      }),
    );
    const picture = feed.profilePictureUrl
      ? await photo(feed.profilePictureUrl)
      : undefined;
    return { posts, picture };
  } catch (error) {
    console.warn('Instagram feed not read, showing the profile only:', error);
    return { posts: [] };
  }
}

/**
 * Returns the newest posts and the profile picture from the Behold feed,
 * read once while the site is built. Returns no posts when no feed is set
 * or any part of it cannot be read, so the page shows only the card that
 * links to the profile.
 */
export function instagramFeed(): Promise<InstagramFeed> {
  return (loaded ??= load());
}
