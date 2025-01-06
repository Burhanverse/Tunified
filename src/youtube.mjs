import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function getYouTubeMusicDetails(artist, track) {
    const searchString = `${artist} ${track}`;
    const options = {
        method: 'GET',
        url: 'https://editorchoice-api-mvmv.onrender.com/ytmsearch',
        params: { query: searchString }
    };

    try {
        const { data } = await axios.request(options);

        const firstResult = data.results[0];

        const modifiedThumbnailUrl = firstResult.thumbnails[0].url.replace(/w60-h60/, 'w1080-h1080');

        return {
            id: firstResult.videoId,
            youtubeMusicLink: `https://music.youtube.com/watch?v=${firstResult.videoId}`,
            albumCover: modifiedThumbnailUrl,
            albumName: firstResult.album.name,
            releaseDate: firstResult.duration,
            artistLink: `https://music.youtube.com/search?q=${artist}`
        };
    } catch (error) {
        console.error('YouTube Music API error:', error);
        return null;
    }
}

export { getYouTubeMusicDetails };
