import axios from "axios";
import { getToken } from "./spotifyAuthService.js";

export async function searchTracks(query) {
  try {
    const accessToken = await getToken();

    const response = await axios.get(
      "https://spclient.wg.spotify.com/searchview/v1/search",
      {
        params: {
          q: query,
          type: "track",
          limit: 10
        },
        headers: {
          "User-Agent": "Spotify/9.0.34.593 Android",
          "Accept-Language": "en",
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );

    const items =
      response.data?.tracks?.items ||
      response.data?.sections?.[0]?.items;

    if (!items || !items.length) {
      throw new Error("No search results");
    }

    return items.map(item => {
      const track = item.track;
      return {
        song: track.name,
        artist: track.artists.map(a => a.name).join(", "),
        album: track.album.name,
        albumUrl: `https://open.spotify.com/album/${track.album.uri.split(":")[2]}`,
        songUrl: `https://open.spotify.com/track/${track.uri.split(":")[2]}`,
        image: track.album.coverArt.sources[0]?.url || null
      };
    });
  } catch (error) {
    console.error("Spotify search error:", error?.response?.data || error);
    throw error;
  }
                     }
