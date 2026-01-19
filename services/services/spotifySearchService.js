import fetch from "node-fetch";
import { getAccessToken } from "./spotifyAuthService.js";

export async function searchTracks(query) {
  const token = await getAccessToken();

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  return data.tracks.items.map(t => ({
    song: t.name,
    artist: t.artists.map(a => a.name).join(", "),
    album: t.album.name,
    albumUrl: t.album.external_urls.spotify,
    songUrl: t.external_urls.spotify,
    image: t.album.images[0]?.url || null
  }));
    }
