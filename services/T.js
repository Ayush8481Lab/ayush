import axios from 'axios';
import { getToken } from './spotifyAuthService.js';

export async function getExtendedMetadata(trackId) {
  try {
    const accessToken = await getToken();
    
    // 1. Clean the ID and convert to Buffer
    const cleanId = trackId.includes(':') ? trackId.split(':').pop() : trackId;
    const uri = `spotify:track:${cleanId}`;
    const uriBuffer = Buffer.from(uri, 'utf-8');
    
    // 2. Build the exact Protobuf (BatchedEntityRequest) manually
    // Field 1 (0x0a) = URI | Field 2 (0x12) = Map Key/Value for TRACK_V4
    const entityReq = Buffer.concat([
      Buffer.from([0x0a, uriBuffer.length]),
      uriBuffer,
      Buffer.from([0x12, 0x04, 0x08, 0x04, 0x12, 0x00])
    ]);
    
    const batchedReq = Buffer.concat([
      Buffer.from([0x0a, entityReq.length]),
      entityReq
    ]);

    // 3. Make the API Call with Mobile Headers
    const response = await axios.post(
      'https://spclient.wg.spotify.com/extended-metadata/v0/extended-metadata',
      batchedReq,
      {
        headers: {
          'Accept': 'application/x-protobuf',
          'Content-Type': 'application/x-protobuf',
          'Accept-Language': 'en',
          'User-Agent': 'Spotify/9.0.34.593 iOS/18.4 (iPhone15,3)',
          'Accept-Encoding': 'gzip, deflate, br',
          'Authorization': `Bearer ${accessToken}`,
        },
        responseType: 'arraybuffer' // MUST request binary arraybuffer
      }
    );

    if (response.status !== 200) {
      console.error(`Metadata fetch failed: ${response.status}`);
      return null;
    }

    // 4. Extract 20-byte File Hashes from the raw binary via Regex
    const hexData = Buffer.from(response.data).toString('hex');
    // Looks for protobuf tags followed by length 0x14 (20 bytes)
    const fileIdMatches = hexData.match(/(?:0a|12|1a|22|2a|32|3a|42|4a|52|5a)14([0-9a-f]{40})/g);
    
    const fileIds = new Set();
    if (fileIdMatches) {
      fileIdMatches.forEach(match => fileIds.add(match.slice(4))); // Trim the tag/length bits
    }

    return {
      success: true,
      file_ids: Array.from(fileIds),
      raw_hex: hexData
    };

  } catch (error) {
    console.error(`Extended metadata request error:`, error.message);
    return null;
  }
}
