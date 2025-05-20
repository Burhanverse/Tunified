import axios from 'axios';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

dotenv.config();

const execAsync = promisify(exec);

async function getYouTubeMusicDetails(artist, track) {
    // Sanitize inputs to prevent command injection
    const sanitizedArtist = artist.replace(/[^\w\s]/g, '').replace(/'/g, "\\'");
    const sanitizedTrack = track.replace(/[^\w\s]/g, '').replace(/'/g, "\\'");
    const searchString = `${sanitizedArtist} ${sanitizedTrack}`;
    
    try {
        const scriptPath = path.join(process.cwd(), 'src/ytmusic', 'api.py');
        const { stdout } = await execAsync(`python3 "${scriptPath}" "${searchString}"`);
        
        const data = JSON.parse(stdout);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!data.results || data.results.length === 0) {
            console.log('No results found for:', searchString);
            return null;
        }
        
        const firstResult = data.results[0];
        
        if (firstResult.thumbnails && firstResult.thumbnails.length > 0) {
            const modifiedThumbnailUrl = firstResult.thumbnails[0].url.replace(/w60-h60/, 'w1080-h1080');
            
            return {
                id: firstResult.videoId,
                albumCover: modifiedThumbnailUrl,
            };
        } else {
            return {
                id: firstResult.videoId,
                albumCover: null,
            };
        }
    } catch (error) {
        console.error('YouTube Music API error:', error);
        return null;
    }
}

export { getYouTubeMusicDetails };
