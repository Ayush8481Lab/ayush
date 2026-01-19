const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

import { getToken } from "./spotifyAuthService.js";

export async function searchTracks(query) {
  const { accessToken } = await getToken();

  const res = await fetch(
    "https://api-partner.spotify.com/pathfinder/v1/query",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query Search($q: String!) {
            search(query: $q, limit: 10) {
              tracks {
                items {
                  uri
                  name
                  artists { name }
                  album {
                    name
                    uri
                    coverArt {
                      sources { url }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { q: query }
      })
    }
  );

  const json = await res.json();

  const items = json?.data?.search?.tracks?.items;
  if (!items) throw new Error("No results");

  return items.map(t => ({
    song: t.name,
    artist: t.artists.map(a => a.name).join(", "),
    album: t.album.name,
    albumUrl: `https://open.spotify.com/album/${t.album.uri.split(":")[2]}`,
    songUrl: `https://open.spotify.com/track/${t.uri.split(":")[2]}`,
    image: t.album.coverArt.sources[0]?.url || null
  }));
}
