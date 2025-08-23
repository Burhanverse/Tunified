import axios from 'axios';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

dotenv.config();

const execAsync = promisify(exec);

async function getYouTubeMusicDetails(artist, track) {
    // Improved sanitization that preserves Unicode characters
    // Only remove dangerous characters that could cause command injection
    const sanitizeForCommand = (str) => {
        if (!str) return '';
        // Remove only dangerous shell characters, preserve Unicode
        return str.replace(/[`$;|&<>(){}[\]\\]/g, '')
                 .replace(/"/g, '\\"')
                 .trim();
    };
    
    const sanitizedArtist = sanitizeForCommand(artist);
    const sanitizedTrack = sanitizeForCommand(track);
    const searchString = `${sanitizedArtist} ${sanitizedTrack}`.trim();
    
    // Early validation to prevent empty queries
    // Use a more lenient check for Unicode - single meaningful characters should be allowed
    if (!searchString || searchString.trim().length < 1) {
        console.log('Search query too short or empty:', searchString);
        return null;
    }
    
    try {
        const scriptPath = path.join(process.cwd(), 'src/ytmusic', 'api.py');
        
        // Use spawn instead of exec for better handling of Unicode arguments
        const { spawn } = await import('child_process');
        const { promisify } = await import('util');
        
        // Create a promise-based wrapper for spawn
        const spawnAsync = () => {
            return new Promise((resolve, reject) => {
                const pythonProcess = spawn('python3', [scriptPath, searchString], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    encoding: 'utf8'
                });
                
                let stdout = '';
                let stderr = '';
                
                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString('utf8');
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString('utf8');
                });
                
                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        resolve({ stdout, stderr });
                    } else {
                        const error = new Error(`Process exited with code ${code}`);
                        error.code = code;
                        error.stdout = stdout;
                        error.stderr = stderr;
                        reject(error);
                    }
                });
                
                pythonProcess.on('error', (error) => {
                    reject(error);
                });
            });
        };
        
        const { stdout } = await spawnAsync();
        
        const data = JSON.parse(stdout);
        
        // Handle error responses gracefully
        if (data.error) {
            console.log('YouTube Music API returned error:', data.error);
            return null;
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
        // Enhanced error handling for different types of errors
        if (error.code === 'ENOENT') {
            console.error('Python3 or script not found:', error.message);
        } else if (error.stdout) {
            // Try to parse error response from Python script
            try {
                const errorData = JSON.parse(error.stdout);
                console.log('YouTube Music API returned error:', errorData.error);
            } catch (parseError) {
                console.error('YouTube Music API error (unparseable):', error.stdout);
            }
        } else {
            console.error('YouTube Music API error:', error.message);
        }
        return null;
    }
}

export { getYouTubeMusicDetails };
