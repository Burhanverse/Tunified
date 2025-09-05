import axios from 'axios';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

dotenv.config();

const execAsync = promisify(exec);

async function getYouTubeMusicDetails(artist, track, album = '') {
    const sanitizeForCommand = (str) => {
        if (!str) return '';
        return str.replace(/[`$;|&<>(){}[\]\\]/g, '')
                 .replace(/"/g, '\\"')
                 .trim();
    };
    
    const sanitizedArtist = sanitizeForCommand(artist);
    const sanitizedTrack = sanitizeForCommand(track);
    const sanitizedAlbum = sanitizeForCommand(album);
    
    let searchString = `${sanitizedTrack} ${sanitizedArtist}`.trim();
    
    if (sanitizedAlbum && sanitizedAlbum.length > 0) {
        searchString += ` ${sanitizedAlbum}`;
    }
    
    if (!searchString || searchString.trim().length < 1) {
        console.log('Search query too short or empty:', searchString);
        return null;
    }
    
    // Removed excessive logging for production use
    
    try {
        const scriptPath = path.join(process.cwd(), 'src/ytmusic', 'api.py');
        
        const { spawn } = await import('child_process');
        const { promisify } = await import('util');
        
        const spawnAsync = () => {
            return new Promise((resolve, reject) => {
                const pythonProcess = spawn('python3', [scriptPath, searchString], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    encoding: 'utf8',
                    timeout: 15000
                });
                
                let stdout = '';
                let stderr = '';
                let finished = false;
                
                const timeoutId = setTimeout(() => {
                    if (!finished) {
                        finished = true;
                        pythonProcess.kill('SIGKILL');
                        reject(new Error('YouTube Music API timeout'));
                    }
                }, 15000);
                
                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString('utf8');
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString('utf8');
                });
                
                pythonProcess.on('close', (code) => {
                    if (finished) return;
                    finished = true;
                    clearTimeout(timeoutId);
                    
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
                    if (finished) return;
                    finished = true;
                    clearTimeout(timeoutId);
                    reject(error);
                });
            });
        };
        
        const { stdout } = await spawnAsync();
        
        if (!stdout || stdout.trim().length === 0) {
            console.log('Empty response from YouTube Music API');
            return null;
        }
        
        const data = JSON.parse(stdout);
        
        if (data.error) {
            console.log('YouTube Music API returned error:', data.error);
            return null;
        }
        
        if (!data.results || data.results.length === 0) {
            console.log('No results found for:', searchString);
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
        if (error.code === 'ENOENT') {
            console.error('Python3 or script not found:', error.message);
        } else if (error.stdout) {
            try {
                const errorData = JSON.parse(error.stdout);
                console.log('YouTube Music API returned error:', errorData.error);
            } catch (parseError) {
                console.error('YouTube Music API error (unparseable):', error.stdout?.slice(0, 100) || 'No output');
            }
        } else {
            console.error('YouTube Music API error:', error.message);
        }
        return null;
    }
}

export { getYouTubeMusicDetails };
