import { searchTracks } from "../services/spotifySearchService.js";

export async function search(req, res) {
  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ error: "Query required" });
  }

  try {
    const results = await searchTracks(q);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: "Search failed" });
  }
}
