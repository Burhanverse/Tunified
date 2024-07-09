import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const youtubeApiKey = process.env.YOUTUBE_API_KEY;

async function getYouTubeMusicDetails(artist, track) {
    const youtube = google.youtube({
        version: 'v3',
        auth: youtubeApiKey
    });

    const response = await youtube.search.list({
        part: 'snippet',
        q: `${artist} ${track}`,
        maxResults: 1
    });

    if (response.data.items.length > 0) {
        const item = response.data.items[0];
        return {
            youtubeMusicLink: `https://music.youtube.com/watch?v=${item.id.videoId}`,
            albumCover: item.snippet.thumbnails.high.url,
            albumName: item.snippet.title,
            releaseDate: item.snippet.publishedAt.split('T')[0],
            id: item.id.videoId, // Adding track id
            artistLink: `https://music.youtube.com/search?q=${artist}` // Adding artist search link
        };
    }

    return null;
}

export { getYouTubeMusicDetails };
