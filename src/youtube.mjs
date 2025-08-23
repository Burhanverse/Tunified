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
        
        // Use the enhanced thumbnail if available, otherwise fall back to processing thumbnails array
        let albumCover = firstResult.thumbnail;
        
        if (!albumCover && firstResult.thumbnails && firstResult.thumbnails.length > 0) {
            // Sort thumbnails by size to get the best quality
            const sortedThumbnails = firstResult.thumbnails.sort((a, b) => 
                (b.width * b.height) - (a.width * a.height)
            );
            
            const bestThumbnail = sortedThumbnails[0];
            albumCover = bestThumbnail.url
                .replace(/w\d+-h\d+/, 'w1080-h1080')
                .replace(/mqdefault/, 'maxresdefault')
                .replace(/hqdefault/, 'maxresdefault');
        }
        
        return {
            id: firstResult.videoId,
            albumCover: albumCover,
            title: firstResult.title || null,
            artists: firstResult.artists || [],
            album: firstResult.album || null
        };
    } catch (error) {
        console.error('YouTube Music API error:', error);
        return null;
    }
}

export { getYouTubeMusicDetails };
