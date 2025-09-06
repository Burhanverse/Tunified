import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YTMUSIC_API_URL = process.env.YTMUSIC_API_URL || 'http://127.0.0.1:8080';

async function getYouTubeMusicDetails(artist, track, album = '') {
    const sanitizeForQuery = (str) => {
        if (!str) return '';
        return str.trim();
    };
    
    const sanitizedArtist = sanitizeForQuery(artist);
    const sanitizedTrack = sanitizeForQuery(track);
    const sanitizedAlbum = sanitizeForQuery(album);
    
    let searchString = `${sanitizedTrack} ${sanitizedArtist}`.trim();
    
    if (sanitizedAlbum && sanitizedAlbum.length > 0) {
        searchString += ` ${sanitizedAlbum}`;
    }
    
    if (!searchString || searchString.trim().length < 1) {
        return null;
    }
    
    try {
        const response = await axios.get(`${YTMUSIC_API_URL}/search`, {
            params: { q: searchString },
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = response.data;
        
        if (data.error) {
            return null;
        }
        
        if (!data.results || data.results.length === 0) {
            return null;
        }
        
        const firstResult = data.results[0];
        
        let albumCover = firstResult.thumbnail;
        
        if (!albumCover && firstResult.thumbnails && firstResult.thumbnails.length > 0) {
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
        if (error.code === 'ECONNREFUSED') {
            console.error('YouTube Music API server is not running. Please start the server with: python3 src/ytmusic/server.py');
        } else if (error.response) {
            console.error('YouTube Music API error:', error.response.data?.error || error.message);
        } else {
            console.error('YouTube Music API error:', error.message);
        }
        return null;
    }
}

export { getYouTubeMusicDetails };
